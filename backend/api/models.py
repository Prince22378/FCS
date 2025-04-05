from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser
import random
from datetime import timedelta
from django.utils import timezone
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError


class User(AbstractUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


    def profile(self):
        profile = Profile.objects.get(user=self)

    def __str__(self):
        return self.username

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=300)
    bio = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to="user_images", default="default.jpg")
    verified = models.BooleanField(default=False)
    is_verification_pending = models.BooleanField(default=False)
    govt_document = models.FileField(upload_to='govt_docs/', null=True, blank=True)
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    public_key = models.TextField(blank=True, null=True) 

    def __str__(self):
        return self.full_name
    
    

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = Profile.objects.create(user=instance)
        # Set full_name to the user's username
        profile.full_name = instance.username
        profile.save()


def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, related_name="friend_requests_sent", on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name="friend_requests_received", on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected')
        ],
        default='pending'
    )

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"
        
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    caption = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Reaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")

    def __str__(self):
        return f"{self.user.username} liked Post {self.post.id}"


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} commented on Post {self.post.id}"


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="user")
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sender")
    reciever = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="reciever")

    message = models.CharField(max_length=10000000000)
    media = models.FileField(upload_to='chat_media/', null=True, blank=True)

    is_read = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['date']
        verbose_name_plural = "Message"

    def __str__(self):
        return f"{self.sender} - {self.reciever}"

    @property
    def sender_profile(self):
        sender_profile = Profile.objects.get(user=self.sender)
        return sender_profile
    @property
    def reciever_profile(self):
        reciever_profile = Profile.objects.get(user=self.reciever)
        return reciever_profile

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)


class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)  # OTP valid for 5 mins

    def __str__(self):
        return f"{self.email} - {self.otp}"


class Report(models.Model):
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports")
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # The user reporting
    reason = models.CharField(max_length=255)  # Reason for reporting (e.g., Spam, Abusive, etc.)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="pending", choices=[("pending", "Pending"), ("resolved", "Resolved"), ("taken_down", "Taken Down")])

    def __str__(self):
        return f"Report by {self.user.username} on Post {self.post.id} for {self.reason}"


class Group(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='group_images/', null=True, blank=True)
    members = models.ManyToManyField(User, related_name='group_members')  # Group members
    created_by = models.ForeignKey(User, related_name='created_groups', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    media = models.FileField(upload_to='group_media/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} in group {self.group.name}"
        
class Listing(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('sold', 'Sold'),
        ('archived', 'Archived')  # Added for completed listings
    ]

    seller = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='listings',
        db_index=True  # Added for better query performance
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]  # Ensure positive price
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='draft',
        db_index=True
    )
    thumbnail = models.ImageField(
        upload_to='listings/%Y/%m/%d/',  # Organized by date
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]  # Validate image types
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Track modifications
    category = models.CharField(  # Added for better organization
        max_length=50,
        blank=True,
        null=True
    )

    class Meta:
        ordering = ['-created_at']  # Newest first by default
        verbose_name_plural = "Listings"
        indexes = [
            models.Index(fields=['title', 'status']),  # Better search performance
        ]

    def __str__(self):
        return f"{self.title} (${self.price}) by {self.seller.username}"

    def clean(self):
        """Additional validation"""
        if self.price < 0:
            raise ValidationError("Price cannot be negative")
            
    @property
    def thumbnail_url(self):
        """Easy access to thumbnail URL"""
        if self.thumbnail and hasattr(self.thumbnail, 'url'):
            return self.thumbnail.url
        return '/static/default_listing.jpg'  # Default image
    

# class Order(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('completed', 'Completed'),
#         ('cancelled', 'Cancelled'),
#         ('shipped', 'Shipped'),
#     ]

#     buyer = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='buyer_orders'
#     )
#     seller = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         related_name='seller_orders'
#     )
#     listing = models.ForeignKey(
#         Listing,
#         on_delete=models.CASCADE,
#         related_name='orders'
#     )
#     status = models.CharField(
#         max_length=10,
#         choices=STATUS_CHOICES,
#         default='pending'
#     )
#     quantity = models.PositiveIntegerField(default=1)
#     price_at_purchase = models.DecimalField(
#         max_digits=10,
#         decimal_places=2
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     shipping_address = models.TextField(blank=True)
#     payment_method = models.CharField(max_length=50, blank=True)

#     class Meta:
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['buyer']),
#             models.Index(fields=['seller']),
#             models.Index(fields=['status']),
#         ]

#     def save(self, *args, **kwargs):
#         if not self.price_at_purchase:
#             self.price_at_purchase = self.listing.price
#         if not self.seller_id:
#             self.seller = self.listing.seller
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"Order #{self.id} - {self.listing.title}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    
    buyer = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"
    
class Withdrawal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]
    
    PAYMENT_METHODS = [
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('paypal', 'PayPal'),
    ]
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Withdrawal #{self.id} - {self.seller.username}"


class Listing(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('sold', 'Sold'),
        ('archived', 'Archived')  # Added for completed listings
    ]

    seller = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='listings',
        db_index=True  # Added for better query performance
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]  # Ensure positive price
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='draft',
        db_index=True
    )
    thumbnail = models.ImageField(
        upload_to='listings/%Y/%m/%d/',  # Organized by date
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]  # Validate image types
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Track modifications
    category = models.CharField(  # Added for better organization
        max_length=50,
        blank=True,
        null=True
    )

    class Meta:
        ordering = ['-created_at']  # Newest first by default
        verbose_name_plural = "Listings"
        indexes = [
            models.Index(fields=['title', 'status']),  # Better search performance
        ]

    def __str__(self):
        return f"{self.title} (${self.price}) by {self.seller.username}"

    def clean(self):
        """Additional validation"""
        if self.price < 0:
            raise ValidationError("Price cannot be negative")
            
    @property
    def thumbnail_url(self):
        """Easy access to thumbnail URL"""
        if self.thumbnail and hasattr(self.thumbnail, 'url'):
            return self.thumbnail.url
        return '/static/default_listing.jpg'  # Default image
    

# class Order(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('completed', 'Completed'),
#         ('cancelled', 'Cancelled'),
#         ('shipped', 'Shipped'),
#     ]

#     buyer = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='buyer_orders'
#     )
#     seller = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         related_name='seller_orders'
#     )
#     listing = models.ForeignKey(
#         Listing,
#         on_delete=models.CASCADE,
#         related_name='orders'
#     )
#     status = models.CharField(
#         max_length=10,
#         choices=STATUS_CHOICES,
#         default='pending'
#     )
#     quantity = models.PositiveIntegerField(default=1)
#     price_at_purchase = models.DecimalField(
#         max_digits=10,
#         decimal_places=2
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     shipping_address = models.TextField(blank=True)
#     payment_method = models.CharField(max_length=50, blank=True)

#     class Meta:
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['buyer']),
#             models.Index(fields=['seller']),
#             models.Index(fields=['status']),
#         ]

#     def save(self, *args, **kwargs):
#         if not self.price_at_purchase:
#             self.price_at_purchase = self.listing.price
#         if not self.seller_id:
#             self.seller = self.listing.seller
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"Order #{self.id} - {self.listing.title}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    
    buyer = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"
    
class Withdrawal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]
    
    PAYMENT_METHODS = [
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('paypal', 'PayPal'),
    ]
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Withdrawal #{self.id} - {self.seller.username}"

class Report(models.Model):
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports")
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # The user reporting
    reason = models.CharField(max_length=255)  # Reason for reporting (e.g., Spam, Abusive, etc.)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="pending", choices=[("pending", "Pending"), ("resolved", "Resolved"), ("taken_down", "Taken Down")])

    def __str__(self):
        return f"Report by {self.user.username} on Post {self.post.id} for {self.reason}"


# class Group(models.Model):
#     name = models.CharField(max_length=255)
#     bio = models.TextField(blank=True, null=True)
#     image = models.ImageField(upload_to='group_images/', null=True, blank=True)
#     members = models.ManyToManyField(User, related_name='group_members')  # Group members
#     created_by = models.ForeignKey(User, related_name='created_groups', on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

# class GroupMessage(models.Model):
#     group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
#     sender = models.ForeignKey(User, on_delete=models.CASCADE)
#     content = models.TextField()
#     media = models.FileField(upload_to='group_media/', null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Message from {self.sender.username} in group {self.group.name}"
