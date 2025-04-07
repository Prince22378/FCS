from django.conf import settings
import requests
from api.models import User, Profile, ChatMessage, FriendRequest, EmailOTP, Post, Comment, Reaction, Listing, Report, Group, GroupMessage
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Listing, Order, Withdrawal




class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # These are claims, you can add custom claims
        token['full_name'] = user.profile.full_name
        token['username'] = user.username
        token['email'] = user.email
        token['bio'] = user.profile.bio
        token['image'] = str(user.profile.image)
        token['verified'] = user.profile.verified
        # ...
        return token

# class PostSerializer(serializers.ModelSerializer):
#     username = serializers.CharField(source='user.username', read_only=True)

#     class Meta:
#         model = Post
#         fields = ['id', 'username', 'image', 'caption', 'created_at']


class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Reaction
        fields = ['id', 'user', 'post', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.profile.full_name", read_only=True)
    profile_image = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'post', 'text', 'created_at', 'username', 'profile_image']

    def get_profile_image(self, obj):
        return obj.user.profile.image.url if obj.user.profile.image else None

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.profile.full_name', read_only=True)
    profile_image = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    has_liked = serializers.SerializerMethodField()
    user = serializers.IntegerField(source='user.id', read_only=True)


    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'username',
            'profile_image',
            'image',
            'caption',
            'created_at',
            'likes_count',   # if you're using
            'comments',       # 👈 Add this line
            'has_liked'
        ]

    def get_profile_image(self, obj):
        try:
            return obj.user.profile.image.url
        except:
            return None
            
    def get_likes_count(self, obj):
        return obj.reactions.count()

    def get_has_liked(self, obj):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            return obj.reactions.filter(user=request.user).exists()  # 👈 updated name
        return False


    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.image:
            rep['image'] = instance.image.url  # returns relative path like /media/posts/xyz.png
        return rep
    


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    public_key = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'public_key')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        public_key = validated_data.pop('public_key')
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']

        )

        user.set_password(validated_data['password'])
        user.save()

        profile = Profile.objects.get(user=user)
        profile.public_key = public_key
        profile.save()

        return user
    
# A simple serializer for friend details
class SimpleProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'user', 'image', 'public_key']

    
class ProfileSerializer(serializers.ModelSerializer):
    govt_document = serializers.SerializerMethodField()
    is_verification_pending = serializers.BooleanField()

    class Meta:
        model = Profile
        fields = [ 'id',  'user',  'full_name', 'bio', 'image', 'verified', 'friends', 'govt_document', 'is_verification_pending', 'public_key' ]
    
    def __init__(self, *args, **kwargs):
        super(ProfileSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method=='POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 3

    def get_friends(self, obj):
        friends = obj.friends.all()
        return SimpleProfileSerializer(friends, many=True).data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Make sure the image field is a valid URL
        if instance.image:
            representation['image'] = instance.image.url  # Returns the absolute URL
        return representation

    def get_govt_document(self, obj):
        if obj.govt_document:
            return f"{obj.govt_document.url}"
        return None

    def update(self, instance, validated_data):
        # Custom update method if you want to modify some fields before saving
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.image = validated_data.get('image', instance.image)
        instance.save()
        return instance


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'timestamp', 'status']


class MessageSerializer(serializers.ModelSerializer):
    reciever_profile = ProfileSerializer(read_only=True)
    sender_profile = ProfileSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id','sender', 'reciever', 'reciever_profile', 'sender_profile' ,'message', 'media', 'is_read', 'date']
    
    def __init__(self, *args, **kwargs):
        super(MessageSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method=='POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2
    
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.media:
            rep['media'] = instance.media.url  # Return full URL path
        return rep


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    recaptcha = serializers.CharField()

    def validate(self, data):
        recaptcha_response = data.get("recaptcha")
        secret_key = settings.RECAPTCHA_SECRET_KEY

        # Verify with Google
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": secret_key,
                "response": recaptcha_response
            }
        )
        result = response.json()

        if not result.get("success"):
            raise serializers.ValidationError("reCAPTCHA verification failed.")

        return data


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            record = EmailOTP.objects.get(email=data['email'])
            if record.otp != data['otp']:
                raise serializers.ValidationError("Invalid OTP.")
            if record.is_expired():
                raise serializers.ValidationError("OTP has expired.")
        except EmailOTP.DoesNotExist:
            raise serializers.ValidationError("OTP not found for this email.")
        return data

class ProfileVerifySerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['govt_document']

    def update(self, instance, validated_data):
        instance.govt_document = validated_data.get('govt_document', instance.govt_document)
        instance.is_verification_pending = True
        instance.save()
        return instance


class VerificationPendingProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    verification_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'full_name', 'govt_document', 'is_verification_pending', 'verified', 'verification_file_url']

    def get_verification_file_url(self, obj):
        if obj.govt_document:
            return f"/api{obj.govt_document.url}"  # 👈 Important
        return None


class ReportSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    class Meta:
        model = Report
        fields = ['id', 'post', 'user', 'reason', 'created_at', 'status']


class GroupSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = Group
        fields = ['id', 'name', 'bio', 'image', 'members', 'created_by', 'created_at']

    def create(self, validated_data):
        group = Group.objects.create(
            name=validated_data['name'],
            bio=validated_data.get('bio', ''),
            created_by=validated_data['created_by']
        )
        group.members.add(validated_data['created_by'])  # The creator is automatically added
        return group
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(f"/api{obj.image.url}")
        return None

# serializers.py
class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer()

    class Meta:
        model = GroupMessage
        fields = ['sender', 'content', 'media', 'created_at']


class ListingSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'description', 'price', 
            'category', 'status', 'thumbnail', 'thumbnail_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['seller', 'created_at', 'updated_at']
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'buyer_name', 'listing', 'listing_title',
            'listing_thumbnail', 'status', 'quantity', 'price_at_purchase',
            'created_at', 'updated_at', 'shipping_address', 'payment_method'
        ]
        read_only_fields = [
            'buyer', 'listing', 'price_at_purchase', 
            'created_at', 'updated_at'
        ]
    
    def get_listing_thumbnail(self, obj):
        if obj.listing.thumbnail:
            return obj.listing.thumbnail.url
        return None

class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = ['id', 'amount', 'payment_method', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']



# buyer
from .models import (
    Listing, Order, Withdrawal, BuyerProfile, Address, PaymentMethod, OrderBuyer, OrderItem, Wishlist, ReturnRequest, Transaction, Invoice, OrderStatusUpdate, Product
)

class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ['phone_number', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'name', 'line1', 'line2', 'city', 
            'state', 'zip_code', 'phone', 'is_default',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class PaymentMethodSerializer(serializers.ModelSerializer):
    masked_card_number = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'payment_type', 'masked_card_number', 'card_name',
            'expiry_month', 'expiry_year', 'upi_id', 'wallet_name',
            'is_default', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'card_number': {'write_only': True},
        }
    
    def get_masked_card_number(self, obj):
        if obj.payment_type in ['credit_card', 'debit_card'] and obj.card_number:
            return f"•••• •••• •••• {obj.card_number[-4:]}"
        return None

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'product_id', 'product_name', 'product_image',
            'quantity', 'price', 'created_at'
        ]
        read_only_fields = fields

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_updates = serializers.SerializerMethodField()
    shipping_address = AddressSerializer(read_only=True)
    payment_method = PaymentMethodSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'total_amount',
            'shipping_address', 'payment_method', 'created_at',
            'updated_at', 'estimated_delivery', 'items', 'status_updates'
        ]
        read_only_fields = fields
    
    def get_status_updates(self, obj):
        updates = obj.status_updates.order_by('update_time')
        return [
            {
                'status': update.get_status_display(),
                'update_time': update.update_time,
                'notes': update.notes
            }
            for update in updates
        ]

class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = [
            'id', 'product_id', 'product_name', 'product_image',
            'price', 'on_sale', 'sale_price', 'added_at'
        ]
        read_only_fields = fields

class ReturnRequestSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        write_only=True
    )
    order_details = OrderSerializer(source='order', read_only=True)
    
    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'order', 'order_details', 'reason', 'notes',
            'status', 'refund_amount', 'created_at', 'updated_at',
            'completion_date'
        ]
        read_only_fields = [
            'status', 'refund_amount', 'created_at', 'updated_at',
            'completion_date', 'order_details'
        ]

class TransactionSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(read_only=True)
    invoice = serializers.PrimaryKeyRelatedField(read_only=True)
    payment_method = PaymentMethodSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'amount', 'description',
            'status', 'payment_method', 'order', 'invoice',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields

class InvoiceSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'order', 'amount',
            'status', 'created_at', 'due_date'
        ]
        read_only_fields = fields


from rest_framework import serializers


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'full_name', 'street', 'city', 'state', 'zip_code', 'phone']

class OrderBuyerSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    address = AddressSerializer()

    class Meta:
        model = OrderBuyer
        fields = ['id', 'buyer', 'status', 'created_at', 'subtotal', 'shipping', 'total', 'items', 'address']
