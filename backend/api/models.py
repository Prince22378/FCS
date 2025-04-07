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
    
class GroupMessageKey(models.Model):
    message = models.ForeignKey(GroupMessage, on_delete=models.CASCADE, related_name='keys')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    encrypted_key = models.TextField()

        
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


# class Listing(models.Model):
#     STATUS_CHOICES = [
#         ('draft', 'Draft'),
#         ('active', 'Active'),
#         ('sold', 'Sold'),
#         ('archived', 'Archived')  # Added for completed listings
#     ]

#     seller = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='listings',
#         db_index=True  # Added for better query performance
#     )
#     title = models.CharField(max_length=100)
#     description = models.TextField()
#     price = models.DecimalField(
#         max_digits=10, 
#         decimal_places=2,
#         validators=[MinValueValidator(0.01)]  # Ensure positive price
#     )
#     status = models.CharField(
#         max_length=10, 
#         choices=STATUS_CHOICES, 
#         default='draft',
#         db_index=True
#     )
#     thumbnail = models.ImageField(
#         upload_to='listings/%Y/%m/%d/',  # Organized by date
#         null=True, 
#         blank=True,
#         validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]  # Validate image types
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)  # Track modifications
#     category = models.CharField(  # Added for better organization
#         max_length=50,
#         blank=True,
#         null=True
#     )

#     class Meta:
#         ordering = ['-created_at']  # Newest first by default
#         verbose_name_plural = "Listings"
#         indexes = [
#             models.Index(fields=['title', 'status']),  # Better search performance
#         ]

#     def __str__(self):
#         return f"{self.title} (${self.price}) by {self.seller.username}"

#     def clean(self):
#         """Additional validation"""
#         if self.price < 0:
#             raise ValidationError("Price cannot be negative")
            
#     @property
#     def thumbnail_url(self):
#         """Easy access to thumbnail URL"""
#         if self.thumbnail and hasattr(self.thumbnail, 'url'):
#             return self.thumbnail.url
#         return '/static/default_listing.jpg'  # Default image
    

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

# class Order(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('completed', 'Completed'),
#     ]
    
#     buyer = models.ForeignKey(User, on_delete=models.CASCADE)
#     listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Order #{self.id}"
    
# class Withdrawal(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('processed', 'Processed'),
#         ('rejected', 'Rejected'),
#     ]
    
#     PAYMENT_METHODS = [
#         ('bank_transfer', 'Bank Transfer'),
#         ('upi', 'UPI'),
#         ('paypal', 'PayPal'),
#     ]
    
#     seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     def __str__(self):
#         return f"Withdrawal #{self.id} - {self.seller.username}"


# ========================
# MARKETPLACE BUYER MODELS
# ========================
class BuyerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile')
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    loyalty_points = models.PositiveIntegerField(default=0)
    preferred_payment_method = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Buyer Profile"

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50)  # e.g., "Home", "Work"
    recipient_name = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="India")
    phone = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.label} - {self.recipient_name}, {self.city}"

class PaymentMethod(models.Model):
    PAYMENT_TYPES = [
        ('UPI', 'UPI ID'),
        ('CARD', 'Credit/Debit Card'),
        ('NETBANKING', 'Net Banking'),
        ('WALLET', 'Digital Wallet'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    is_default = models.BooleanField(default=False)
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    card_last4 = models.CharField(max_length=4, blank=True, null=True)
    card_brand = models.CharField(max_length=20, blank=True, null=True)
    wallet_name = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        if self.type == 'UPI':
            return f"UPI: {self.upi_id}"
        elif self.type == 'CARD':
            return f"Card: ****{self.card_last4} ({self.card_brand})"
        return f"{self.get_type_display()}"

# class Listing(models.Model):
#     STATUS_CHOICES = [
#         ('DRAFT', 'Draft'),
#         ('ACTIVE', 'Active'),
#         ('SOLD', 'Sold'),
#         ('ARCHIVED', 'Archived'),
#     ]

#     seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
#     title = models.CharField(max_length=100)
#     description = models.TextField()
#     price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='DRAFT')
#     thumbnail = models.ImageField(upload_to='listings/', null=True, blank=True)
#     stock = models.PositiveIntegerField(default=1)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         ordering = ['-created_at']
#         indexes = [models.Index(fields=['status', 'price'])]

#     def clean(self):
#         if self.price < 0:
#             raise ValidationError("Price cannot be negative")

#     def __str__(self):
#         return f"{self.title} (₹{self.price})"

class OrderBuyer(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'),
    ]

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.ForeignKey(Address, on_delete=models.PROTECT)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['order_number', 'status'])]

    def __str__(self):
        return f"Order #{self.order_number}"

class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', null=True, blank=True)

    def __str__(self):
        return self.name

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    listing = models.ForeignKey(Listing, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.listing.title} @ ₹{self.price_at_purchase}"

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    transaction_id = models.CharField(max_length=100, unique=True)
    gateway_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TXN-{self.transaction_id}"

class Invoice(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=20, unique=True)
    file = models.FileField(upload_to='invoices/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.invoice_number}"

class OrderStatusUpdate(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_updates')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Status update: {self.old_status} → {self.new_status}"

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'listing')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s wishlist item"

class ReturnRequest(models.Model):
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PROCESSED', 'Processed'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Return request for Order #{self.order.order_number}"

# class Withdrawal(models.Model):
#     STATUS_CHOICES = [
#         ('PENDING', 'Pending'),
#         ('PROCESSED', 'Processed'),
#         ('REJECTED', 'Rejected'),
#     ]

#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawals')
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
#     reference_id = models.CharField(max_length=100, unique=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     processed_at = models.DateTimeField(null=True, blank=True)

#     class Meta:
#         ordering = ['-created_at']

#     def __str__(self):
#         return f"Withdrawal #{self.reference_id}"