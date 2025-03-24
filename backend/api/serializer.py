from django.conf import settings
import requests
from api.models import User, Profile, ChatMessage, FriendRequest, EmailOTP, Post, Comment, Reaction
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

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
    username = serializers.CharField(source="user.username", read_only=True)
    profile_image = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'post', 'text', 'created_at', 'username', 'profile_image']

    def get_profile_image(self, obj):
        return obj.user.profile.image.url if obj.user.profile.image else None

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    profile_image = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    has_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
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

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})

        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']

        )

        user.set_password(validated_data['password'])
        user.save()

        return user
    
# A simple serializer for friend details
class SimpleProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'user']

    
class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = [ 'id',  'user',  'full_name', 'bio', 'image', 'verified', 'friends' ]
    
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
        fields = ['id','sender', 'reciever', 'reciever_profile', 'sender_profile' ,'message', 'is_read', 'date']
    
    def __init__(self, *args, **kwargs):
        super(MessageSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method=='POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 2


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
