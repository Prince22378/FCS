from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Q, Subquery, OuterRef
from django.db import models

from api.models import User, Profile, ChatMessage, FriendRequest, EmailOTP

from api.serializer import MyTokenObtainPairSerializer, RegisterSerializer, UserSerializer, ProfileSerializer, MessageSerializer, FriendRequestSerializer, SimpleProfileSerializer, SendOTPSerializer, VerifyOTPSerializer, UserReportSerializer

from rest_framework import serializers 
from rest_framework.pagination import PageNumberPagination

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.views import APIView

from rest_framework import viewsets, permissions
from .models import Post, Reaction, Comment, Profile
from .serializer import PostSerializer, CommentSerializer, ReactionSerializer, ProfileSerializer
from django.shortcuts import get_object_or_404

from django.http import FileResponse


from rest_framework.generics import ListAPIView, RetrieveAPIView
from api.models import Comment, Report, Group, GroupMessage, GroupMessageKey
from api.serializer import CommentSerializer, ProfileVerifySerializer, VerificationPendingProfileSerializer, ReportSerializer, GroupSerializer, GroupMessageSerializer, ListingSerializer
import random
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Listing, UserReport
from .models import Order
from .serializer import ListingSerializer, OrderSerializer
from rest_framework import generics, permissions
import json
from .models import (Listing, Order, Withdrawal, BuyerProfile, Address, PaymentMethod, Order, OrderItem, Wishlist, ReturnRequest, Transaction, Invoice, OrderStatusUpdate)

from .serializer import (
    BuyerProfileSerializer, AddressSerializer, 
    PaymentMethodSerializer, OrderSerializer,
    OrderItemSerializer, WishlistSerializer,
    ReturnRequestSerializer, TransactionSerializer,
    InvoiceSerializer
)

from .models import CartItem
from .serializer import CartItemSerializer

from .serializer import (
    ListingSerializer, 
    OrderSerializer,
    WithdrawalSerializer
)



class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow DELETE only if the logged-in user is the post owner
        return obj.user == request.user

class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            now = timezone.now()

            # Check if OTP was already sent recently
            try:
                otp_record = EmailOTP.objects.get(email=email)
                time_since_last_otp = (now - otp_record.created_at).total_seconds()

                if time_since_last_otp < 30:
                    wait_time = int(30 - time_since_last_otp)
                    return Response({
                        "error": f"OTP already sent. Please wait {wait_time} more seconds."
                    }, status=429)  # 429 Too Many Requests

            except EmailOTP.DoesNotExist:
                pass  # No previous OTP, safe to create

            # Generate and send new OTP
            otp = f"{random.randint(100000, 999999)}"
            EmailOTP.objects.update_or_create(email=email, defaults={'otp': otp, 'created_at': now})

            # Replace with actual send_mail setup
            send_mail(
                subject="Verify Your Email - OTP",
                message=f"""
                Hi there,

                Thanks for signing up! Please use the following OTP to verify your email:

                    {otp}

                This code will expire in 5 minutes.

                If you didn’t request this, just ignore this message.

                """,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({"message": "OTP sent to email."})
        return Response(serializer.errors, status=400)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            return Response({"verified": True})
        return Response(serializer.errors, status=400)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp = request.data.get("otp")
        try:
            record = EmailOTP.objects.get(email=email)
            if record.otp != otp or record.is_expired():
                return Response({"otp": "Invalid or expired OTP."}, status=400)
        except EmailOTP.DoesNotExist:
            return Response({"otp": "OTP not found."}, status=400)

        # If OTP valid, delete it and proceed
        record.delete()
        return super().create(request, *args, **kwargs)


# Get All Routes

@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token/',
        '/api/register/',
        '/api/token/refresh/'
    ]
    return Response(routes)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
    if request.method == 'GET':
        data = f"Congratulation {request.user}, your API just responded to GET request"
        return Response({'response': data}, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        text = "Hello buddy"
        data = f'Congratulation your API just responded to POST request with text: {text}'
        return Response({'response': data}, status=status.HTTP_200_OK)
    return Response({}, status.HTTP_400_BAD_REQUEST)


class AdminDashboard(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        messages = ChatMessage.objects.all()
        profiles = Profile.objects.all()

        user_data = UserSerializer(users, many=True).data
        message_data = MessageSerializer(messages, many=True).data
        profile_data = ProfileSerializer(profiles, many=True).data

        return Response({
            "users": user_data,
            "messages": message_data,
            "profiles": profile_data
        })
    
class ToggleUserVerification(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, profile_id):
        try:
            profile = Profile.objects.get(id=profile_id)
            profile.verified = not profile.verified  # Toggle verification
            profile.save()
            return Response({"message": "Verification status updated", "verified": profile.verified}, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
    


class GetMessages(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        sender_id = self.kwargs['sender_id']
        reciever_id = self.kwargs['reciever_id']
        user_id = str(self.request.user.id)

        if user_id not in [str(sender_id), str(reciever_id)]:
            raise PermissionDenied("You are not allowed to view these messages.")

        return ChatMessage.objects.filter(
            sender__in=[sender_id, reciever_id],
            reciever__in=[sender_id, reciever_id]
        )


class SendMessages(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    parser_classes = [MultiPartParser, FormParser] 

    def perform_create(self, serializer):
        sender = self.request.user
        reciever = self.request.data.get("reciever")

        if not reciever:
            raise PermissionDenied("Receiver is required.")
        if str(sender.id) == str(reciever):
            raise PermissionDenied("You cannot send messages to yourself.")

        serializer.save(sender=sender)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    # permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]


    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # def get_queryset(self):
    #     return Post.objects.all()

class ReactToPost(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get("post")
        post = get_object_or_404(Post, id=post_id)
        reaction, created = Reaction.objects.get_or_create(user=request.user, post=post)
        if not created:
            reaction.delete()
            return Response({"message": "Like removed"})
        return Response({"message": "Post liked"})


class AddComment(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class ProfileDetail(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    permission_classes = [IsAuthenticated]  

    def get_object(self):
        # Ensure that the profile being fetched belongs to the logged-in user
        return self.request.user.profile

    def perform_update(self, serializer):
        # Perform the update on the profile
        profile = serializer.save()
        # Optionally, you can add more custom logic here if needed
        return profile


class SearchUser(generics.ListAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    permission_classes = [IsAuthenticated]  

    def list(self, request, *args, **kwargs):
        username = self.kwargs['username']
        logged_in_user = self.request.user
        users = Profile.objects.filter(Q(user__username__icontains=username) | Q(full_name__icontains=username) | Q(user__email__icontains=username) )

        if not users.exists():
            return Response(
                {"detail": "No users found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    

# View to list current user's friends
class FriendListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SimpleProfileSerializer

    def get_queryset(self):
        return self.request.user.profile.friends.all()

# View to list pending friend requests received by the current user
class PendingFriendRequestsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        return FriendRequest.objects.filter(to_user=self.request.user, status='pending')

# View to send a friend request to another user
class SendFriendRequestView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendRequestSerializer

    def create(self, request, *args, **kwargs):
        target_user_id = request.data.get("to_user_id")
        if not target_user_id:
            return Response({"error": "to_user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Check for duplicate request or if already friends
        if FriendRequest.objects.filter(from_user=request.user, to_user=target_user, status="pending").exists():
            return Response({"error": "Friend request already sent."}, status=status.HTTP_400_BAD_REQUEST)
        if target_user.profile in request.user.profile.friends.all():
            return Response({"error": "You are already friends."}, status=status.HTTP_400_BAD_REQUEST)

        friend_request = FriendRequest.objects.create(from_user=request.user, to_user=target_user)
        serializer = self.get_serializer(friend_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# View to respond to a friend request (accept or reject)
class RespondFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        action = request.data.get("action")
        if action not in ["accept", "reject"]:
            return Response({"error": "Invalid action. Must be 'accept' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if action == "accept":
            friend_request.status = "accepted"
            friend_request.save()
            # Add each other as friends (symmetric)
            request.user.profile.friends.add(friend_request.from_user.profile)
            return Response({"message": "Friend request accepted."}, status=status.HTTP_200_OK)
        else:
            friend_request.status = "rejected"
            friend_request.save()
            return Response({"message": "Friend request rejected."}, status=status.HTTP_200_OK)

# Optional: View to list all registered users (for browsing and sending friend requests)
class AllUsersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()


# @api_view(['GET'])
# def public_profile_view(request, user_id):
#     try:
#         profile = Profile.objects.get(user__id=user_id)
#         serializer = ProfileSerializer(profile)
#         return Response(serializer.data)
#     except Profile.DoesNotExist:
#         return Response({"error": "User not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Ensures the user is authenticated
def public_profile_view(request, user_id):
    if not request.user.is_authenticated:
        # If the user is not authenticated, return generic data or a message
        return Response({
            'message': 'Please log in to view the profile.',
            'image_url': '/media/default_placeholder_image.jpg'  # Example placeholder image
        }, status=403)  # Forbidden status
    
    try:
        # If authenticated, fetch the profile and return the actual data
        profile = Profile.objects.get(user__id=user_id)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
    except Profile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

class LimitedCommentsView(ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')[:3]  # last 3

class AllCommentsView(ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')

class ProfileVerificationUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, user_id):
        try:
            profile = Profile.objects.get(user__id=user_id)

            if profile.user != request.user:
                return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

            serializer = ProfileVerifySerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"detail": "Document uploaded. Awaiting verification."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)


class PendingVerificationsView(ListAPIView):
    queryset = Profile.objects.filter(is_verification_pending=True)
    serializer_class = VerificationPendingProfileSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        return {"request": self.request}  



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_verification_doc(request):
    profile = request.user.profile
    if 'document' not in request.FILES:
        return Response({'error': 'No document provided.'}, status=400)

    profile.verified_doc = request.FILES['document']
    profile.save()
    return Response({'message': 'Document uploaded, awaiting admin verification.'})



class ReportPostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id = request.data.get('post')  # The post ID being reported
        reason = request.data.get('reason')  # The reason for reporting

        if not post_id or not reason:
            return Response({"error": "Post ID and reason are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        # Create the report object
        report = Report.objects.create(
            post=post,
            user=request.user,
            reason=reason,
            status="pending"
        )

        return Response({"message": "Report submitted successfully."}, status=status.HTTP_201_CREATED)

class ResolveReport(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id)
            # Mark the report as resolved
            report.status = 'resolved'  # Add a status field to your Report model if not present
            report.save()

            return Response({"message": "Report resolved successfully."}, status=status.HTTP_200_OK)
        except Report.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)


class TakeDownPost(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'taken_down'
            report.save()
            post = report.post 
            post.delete()  # Take down the post by deleting it

            # Mark the report as taken down (we could also add a status field in the report model to track this)

            # Return a success response
            return Response({"message": "Post has been taken down successfully."}, status=status.HTTP_200_OK)

        except Report.DoesNotExist:
            return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)




class ReportListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]  # Ensure only admins can access this view
    serializer_class = ReportSerializer

    def get_queryset(self):
        return Report.objects.all().order_by('-created_at')  # Order by the most recent reports


# class CreateGroupView(generics.CreateAPIView):
#     serializer_class = GroupSerializer
#     # permission_classes = [IsAuthenticated]

#     def perform_create(self, serializer):
#         serializer.save(created_by=self.request.user)

# class CreateGroupView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         data = request.data
#         group_name = request.data.get('name')
#         group_bio = request.data.get('bio')
#         members = request.data.get('members')
        
#         if not members:
#             return Response({"error": "Group must have at least one member."}, status=status.HTTP_400_BAD_REQUEST)

#         # Add the creator (current user) to the members list
#         members.append(request.user.id)
        
#         group = Group.objects.create(name=group_name, bio=group_bio, created_by=request.user)

#         # Your other logic to create a group
#         group.members.set(members)

#         # Save the group instance
#         group.save()

#         # Return a success response
#         return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)

class CreateGroupView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        name = request.data.get("name")
        bio = request.data.get("bio")
        members = request.data.getlist("members")
        image = request.FILES.get("image")

        if not members:
            return Response({"error": "Group must have at least one member."}, status=400)

        members = list(set(members + [str(request.user.id)]))

        group = Group.objects.create(
            name=name,
            bio=bio,
            image=image,
            created_by=request.user
        )
        group.members.set(members)
        return Response(GroupSerializer(group, context={'request': request}).data, status=201)



class GroupListView(ListAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(members=self.request.user)
    def get_serializer_context(self):
        return {'request': self.request} 

class GroupDetailView(RetrieveAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

# views.py
class GroupChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        # Fetch messages for a group
        group = get_object_or_404(Group, id=group_id)
        messages = group.messages.all().order_by('created_at')
        serializer = GroupMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        content = request.data.get("content")
        media = request.FILES.get("media")
        encrypted_keys = request.data.getlist("encrypted_keys")

        if not content and not media:
            return Response({"error": "Content or media required"}, status=400)

        message = GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=content,
            media=media
        )

        for ek_json in encrypted_keys:
            try:
                key_data = json.loads(ek_json)
                GroupMessageKey.objects.create(
                    message=message,
                    recipient_id=key_data['recipient_id'],
                    encrypted_key=key_data['encrypted_key']
                )
            except Exception as e:
                print(f"Failed to save encrypted key: {e}")

        return Response(GroupMessageSerializer(message).data, status=201)



# class MarketplaceListAPI(generics.ListAPIView):
#     """
#     Public marketplace view for all users
#     """
#     serializer_class = ListingSerializer
#     queryset = Listing.objects.filter(status='active')  # Only show active listings
    
#     def get_queryset(self):
#         queryset = super().get_queryset()
#         # Add simple search functionality
#         search_query = self.request.query_params.get('search', None)
#         if search_query:
#             queryset = queryset.filter(title__icontains=search_query)
#         return queryset
    
class SellerListingsAPI(generics.ListCreateAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.profile.verified:
            raise PermissionDenied("You must verify your account to access marketplace features")
        return Listing.objects.filter(seller=self.request.user)

class MarketplaceListAPI(generics.ListAPIView):
    serializer_class = ListingSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated and not self.request.user.profile.verified:
            raise PermissionDenied("You must verify your account to access marketplace features")
        return Listing.objects.filter(status='active')

class ListingDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Ensures users can only access their own listings"""
        return Listing.objects.filter(seller=self.request.user)
    
class PublicListingDetailAPI(generics.RetrieveAPIView):
    queryset = Listing.objects.filter(status='active')  # show only active listings
    serializer_class = ListingSerializer
    permission_classes = [permissions.AllowAny]

from .models import Listing, Order

class SellerDashboardAPI(APIView):
    def get(self, request):
        seller = request.user
        listings = Listing.objects.filter(seller=seller)
        orders = Order.objects.filter(listing__seller=seller)
        
        return Response({
            'stats': {
                'totalSales': orders.filter(status='completed').count(),
                'pendingOrders': orders.filter(status='pending').count(),
                'completedOrders': orders.filter(status='completed').count(),
                'balance': sum(order.price_at_purchase for order in orders.filter(status='completed'))
            },
            'listings': ListingSerializer(listings, many=True).data,
            'orders': OrderSerializer(orders.order_by('-created_at'), many=True).data
        })
    
class BuyerMarketplaceAPI(APIView):
    """
    API endpoint for buyers to view active marketplace listings
    """
    def get(self, request):
        try:
            active_listings = Listing.objects.filter(status='active')
            serializer = ListingSerializer(active_listings, many=True)
            return Response({
                'success': True,
                'listings': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CreateListingAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # For FormData, we need to use request.POST for regular fields
            # and request.FILES for files
            data = {
                'title': request.POST.get('title'),
                'description': request.POST.get('description'),
                'price': request.POST.get('price'),
                'category': request.POST.get('category'),
                'stock': request.POST.get('stock'),
                'status': request.POST.get('status'),
                'thumbnail': request.FILES.get('thumbnail'),
            }
            
            serializer = ListingSerializer(data=data)
            if serializer.is_valid():
                serializer.save(seller=request.user)
                return Response({
                    'success': True,
                    'listing': serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'buyer',
            'buyer_name',
            'listing',
            'listing_title',
            'thumbnail',
            'status',
            'quantity',
            'price_at_purchase',
            'created_at',
            'shipping_address',
            'payment_method'
        ]
        read_only_fields = [
            'buyer',
            'seller',
            'price_at_purchase',
            'created_at'
        ]

    def get_thumbnail(self, obj):
        if obj.listing.thumbnail:
            return obj.listing.thumbnail.url
        return None
    


class SellerListingsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        listings = Listing.objects.filter(seller=request.user)
        serializer = ListingSerializer(listings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ListingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(seller=request.user)
            return Response({
                'success': True,
                'listing': serializer.data
            }, status=201)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)

class SellerListingDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Listing.objects.get(pk=pk, seller=self.request.user)
        except Listing.DoesNotExist:
            return None

    def get(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response({'success': False, 'error': 'Not found'}, status=404)
        serializer = ListingSerializer(listing)
        return Response({'success': True, 'listing': serializer.data})

    def put(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response({'success': False, 'error': 'Not found'}, status=404)
        
        serializer = ListingSerializer(listing, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'listing': serializer.data})
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)

    def delete(self, request, pk):
        listing = self.get_object(pk)
        if not listing:
            return Response({'success': False, 'error': 'Not found'}, status=404)
        listing.delete()
        return Response({'success': True}, status=204)

class SellerOrdersAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(listing__seller=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response({
            'success': True,
            'orders': serializer.data
        })

class SellerOrderDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Order.objects.get(pk=pk, listing__seller=self.request.user)
        except Order.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response({'success': False, 'error': 'Not found'}, status=404)
        serializer = OrderSerializer(order)
        return Response({'success': True, 'order': serializer.data})

    def patch(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response({'success': False, 'error': 'Not found'}, status=404)
        
        serializer = OrderSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'order': serializer.data})
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)

class SellerStatsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        completed_orders = Order.objects.filter(
            listing__seller=request.user,
            status='completed'
        )
        pending_orders = Order.objects.filter(
            listing__seller=request.user,
            status='pending'
        )
        
        total_sales = sum(order.price_at_purchase for order in completed_orders)
        available_balance = total_sales * 0.85  # Assuming 15% platform fee
        
        return Response({
            'success': True,
            'stats': {
                'total_sales': total_sales,
                'pending_orders': pending_orders.count(),
                'completed_orders': completed_orders.count(),
                'balance': available_balance
            }
        })

class WithdrawalAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalSerializer(data=request.data)
        if serializer.is_valid():
            # Check available balance
            stats = SellerStatsAPI().get(request).data['stats']
            if serializer.validated_data['amount'] > stats['balance']:
                return Response({
                    'success': False,
                    'error': 'Amount exceeds available balance'
                }, status=400)
                
            serializer.save(seller=request.user)
            return Response({
                'success': True,
                'withdrawal': serializer.data
            }, status=201)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=400)
        



# Buyer

class BuyerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = BuyerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = BuyerProfile.objects.get_or_create(user=self.request.user)
        return profile

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        address = serializer.save(user=self.request.user)
        # If this is the first address or user marked it as default, set as default
        if self.request.user.addresses.count() == 1 or address.is_default:
            self.request.user.addresses.exclude(id=address.id).update(is_default=False)
            address.is_default = True
            address.save()

class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_update(self, serializer):
        address = serializer.save()
        # If marked as default, update other addresses
        if address.is_default:
            self.request.user.addresses.exclude(id=address.id).update(is_default=False)

class SetDefaultAddressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        address = get_object_or_404(Address, pk=pk, user=request.user)
        request.user.addresses.exclude(id=address.id).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'status': 'address set as default'}, status=status.HTTP_200_OK)

class PaymentMethodListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.payment_methods.all()

    def perform_create(self, serializer):
        payment_method = serializer.save(user=self.request.user)
        # If this is the first payment method or user marked it as default, set as default
        if self.request.user.payment_methods.count() == 1 or payment_method.is_default:
            self.request.user.payment_methods.exclude(id=payment_method.id).update(is_default=False)
            payment_method.is_default = True
            payment_method.save()

class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.payment_methods.all()

    def perform_update(self, serializer):
        payment_method = serializer.save()
        # If marked as default, update other payment methods
        if payment_method.is_default:
            self.request.user.payment_methods.exclude(id=payment_method.id).update(is_default=False)

class SetDefaultPaymentMethodView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        payment_method = get_object_or_404(PaymentMethod, pk=pk, user=request.user)
        request.user.payment_methods.exclude(id=payment_method.id).update(is_default=False)
        payment_method.is_default = True
        payment_method.save()
        return Response({'status': 'payment method set as default'}, status=status.HTTP_200_OK)

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.all().order_by('-created_at')

class RecentOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.all().order_by('-created_at')[:5]

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.all()

class OrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.request.user.orders.all().order_by('-created_at')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by year if provided
        year_filter = self.request.query_params.get('year', None)
        if year_filter:
            queryset = queryset.filter(created_at__year=year_filter)
        
        return queryset

class TrackOrderView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        order_id = self.kwargs.get('pk')
        if order_id == 'latest':
            return self.request.user.orders.order_by('-created_at').first()
        return get_object_or_404(Order, pk=order_id, user=self.request.user)

class UpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status transition
        valid_transitions = {
            'pending': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered'],
            'delivered': [],
            'cancelled': []
        }
        
        if new_status not in valid_transitions.get(order.status, []):
            return Response(
                {'error': f'Invalid status transition from {order.status} to {new_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
        # Create status update record
        OrderStatusUpdate.objects.create(
            order=order,
            status=new_status,
            notes=f"Status changed to {new_status}"
        )
        
        return Response(OrderSerializer(order).data)

class WishlistListView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.wishlist_items.all().order_by('-added_at')

    def perform_create(self, serializer):
        product_id = serializer.validated_data.get('product_id')
        # Check if product already exists in wishlist
        if self.request.user.wishlist_items.filter(product_id=product_id).exists():
            raise serializers.ValidationError("Product already in wishlist")
        serializer.save(user=self.request.user)

class WishlistDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.wishlist_items.all()

class EligibleReturnOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get delivered orders within the last 30 days that haven't been returned
        thirty_days_ago = timezone.now() - timedelta(days=30)
        return self.request.user.orders.filter(
            status='delivered',
            created_at__gte=thirty_days_ago
        ).exclude(
            returns__status__in=['pending', 'approved', 'completed']
        )

class ReturnRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.return_requests.all().order_by('-created_at')

    def perform_create(self, serializer):
        order_id = serializer.validated_data.get('order').id
        order = get_object_or_404(Order, pk=order_id, user=self.request.user)
        
        # Validate order is eligible for return
        thirty_days_ago = timezone.now() - timedelta(days=30)
        if order.status != 'delivered' or order.created_at < thirty_days_ago:
            raise serializers.ValidationError("Order is not eligible for return")
        
        # Calculate refund amount (full amount for simplicity)
        refund_amount = order.total_amount
        
        return_request = serializer.save(
            user=self.request.user,
            refund_amount=refund_amount
        )
        
        # Create a refund transaction record
        Transaction.objects.create(
            user=self.request.user,
            transaction_type='refund',
            amount=refund_amount,
            description=f"Refund for return request #{return_request.id}",
            status='pending',
            order=order
        )

class ReturnRequestDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.return_requests.all()

    def perform_update(self, serializer):
        return_request = serializer.save()
        
        # If status changed to completed, update transaction
        if return_request.status == 'completed' and not return_request.completion_date:
            return_request.completion_date = timezone.now()
            return_request.save()
            
            # Update transaction status
            transaction = Transaction.objects.filter(
                order=return_request.order,
                transaction_type='refund'
            ).first()
            if transaction:
                transaction.status = 'completed'
                transaction.save()

class CancelReturnRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        return_request = get_object_or_404(ReturnRequest, pk=pk, user=request.user)
        
        if return_request.status != 'pending':
            return Response(
                {'error': 'Only pending return requests can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.status = 'cancelled'
        return_request.save()
        
        # Update transaction status
        transaction = Transaction.objects.filter(
            order=return_request.order,
            transaction_type='refund'
        ).first()
        if transaction:
            transaction.status = 'failed'
            transaction.save()
        
        return Response({'status': 'return request cancelled'})

class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.transactions.all().order_by('-created_at')

class InvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(order__user=self.request.user).order_by('-created_at')

class DownloadInvoiceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk, order__user=request.user)
        
        if not invoice.pdf_file:
            return Response(
                {'error': 'Invoice PDF not available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response = FileResponse(invoice.pdf_file)
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response

class BuyerDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get recent orders count (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders = request.user.orders.filter(created_at__gte=thirty_days_ago).count()
        
        # Get wishlist items count
        wishlist_items = request.user.wishlist_items.count()
        
        # Get pending refund amount
        pending_refunds = request.user.return_requests.filter(
            status__in=['pending', 'approved']
        ).aggregate(total=models.Sum('refund_amount'))['total'] or 0
        
        return Response({
            'active_orders': recent_orders,
            'wishlist_items': wishlist_items,
            'pending_refunds': pending_refunds
        })
    
class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

class PublicProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        listings = Listing.objects.filter(status='active').order_by('-created_at')
        paginator = ProductPagination()
        result_page = paginator.paginate_queryset(listings, request)
        serializer = ListingSerializer(result_page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    

from django.http import JsonResponse
from django.core.mail import send_mail
import random

def send_payment_otp(request):
    if request.method == 'POST':
        upi_id = request.POST.get('upiId')
        otp = str(random.randint(100000, 999999))  # Generate 6-digit OTP
        
        # Store OTP in session/database (simplified example)
        request.session['payment_otp'] = otp
        request.session['upi_id'] = upi_id
        
        # Send OTP via email (using your existing EMAIL_BACKEND)
        send_mail(
            'UPI Payment OTP',
            f'Your OTP for UPI payment is: {otp}',
            'meetpalfcs@gmail.com',
            [request.user.email],  # Assuming user is logged in
            fail_silently=False,
        )
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)

def verify_payment_otp(request):
    if request.method == 'POST':
        user_otp = request.POST.get('otp')
        stored_otp = request.session.get('payment_otp')
        
        if user_otp == stored_otp:
            # Clear OTP after successful verification
            del request.session['payment_otp']
            return JsonResponse({'success': True})
        return JsonResponse({'success': False}, status=400)

def confirm_payment(request):
    # Mock payment confirmation (replace with actual logic)
    return JsonResponse({'success': True})


from rest_framework import generics, status
from rest_framework.response import Response
from .models import OrderBuyer, OrderItem, Address, Product
from .serializer import OrderBuyerSerializer, AddressSerializer
from django.contrib.auth import get_user_model
import random

User = get_user_model()

class CartView(generics.GenericAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        product_id = request.data.get('product_id')

        # Validate quantity
        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                return Response({"error": "Quantity must be positive"}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Listing.objects.filter(status='active').get(id=product_id)
        except Listing.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        item, created = CartItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()

        # Optionally return updated cart
        items = CartItem.objects.filter(user=request.user)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, *args, **kwargs):
        item_id = kwargs.get('pk')

        # Validate quantity
        try:
            quantity = int(request.data.get('quantity'))
            if quantity <= 0:
                return Response({"error": "Quantity must be positive"}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = CartItem.objects.get(id=item_id, user=request.user)
            item.quantity = quantity
            item.save()
            return Response({"message": "Quantity updated"}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, *args, **kwargs):
        item_id = kwargs.get('pk')
        try:
            item = CartItem.objects.get(id=item_id, user=request.user)
            item.delete()
            return Response({"message": "Item removed"}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)




from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from decimal import Decimal
from decimal import Decimal
from django.db import transaction

class CheckoutView(generics.CreateAPIView):
    serializer_class = OrderBuyerSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        if not request.session.get('otp_verified'):
            return Response({"error": "Payment OTP not verified."}, status=status.HTTP_403_FORBIDDEN)

        cart_items = CartItem.objects.select_related('product__seller').filter(user=request.user)
        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.product.price * item.quantity for item in cart_items)
        shipping = 0 if subtotal > 1000 else 50
        total = subtotal + shipping

        with transaction.atomic():
            # Create order
            order = OrderBuyer.objects.create(
                buyer=request.user,
                subtotal=subtotal,
                shipping=shipping,
                total=total,
                payment_method=request.data.get('payment_method', 'UPI'),
                upi_id=request.data.get('upi_id')
            )

            for item in cart_items:
                listing = item.product  # product is Listing
                quantity = item.quantity
                seller = listing.seller

                # Ensure enough stock
                if listing.stock < quantity:
                    raise serializers.ValidationError(f"Not enough stock for {listing.title}")

                # Decrease stock
                listing.stock -= quantity
                if listing.stock == 0:
                    listing.status = 'sold'
                listing.save()

                # Credit seller's wallet
                try:
                    seller_profile = seller.seller_profile
                    amount = Decimal(listing.price) * quantity
                    seller_profile.wallet_balance += amount
                    seller_profile.total_earnings += amount
                    seller_profile.save()
                except SellerProfile.DoesNotExist:
                    # Optional: handle missing profile
                    raise serializers.ValidationError(f"Seller profile for {seller.username} not found.")

                # Create order item
                OrderItem.objects.create(
                    order=order,
                    product=listing,
                    quantity=quantity,
                    price=listing.price
                )

            # Clear cart
            cart_items.delete()
            request.session['cart'] = []
            request.session.pop('otp_verified', None)

        return Response(OrderBuyerSerializer(order).data, status=status.HTTP_201_CREATED)




class OrderDetailsView(generics.RetrieveAPIView):
    queryset = OrderBuyer.objects.all()
    serializer_class = OrderBuyerSerializer
    lookup_field = 'id'

class AddressView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework.permissions import IsAuthenticated


from rest_framework.generics import RetrieveUpdateAPIView
from .models import SellerProfile
from .serializer import SellerProfileSerializer
from rest_framework.permissions import IsAuthenticated

class SellerProfileView(RetrieveUpdateAPIView):
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.seller_profile


class SendPaymentOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        email = user.email
        now = timezone.now()

        try:
            otp_record = EmailOTP.objects.get(email=email, purpose='payment')
            time_since_last_otp = (now - otp_record.created_at).total_seconds()
            if time_since_last_otp < 30:
                wait_time = int(30 - time_since_last_otp)
                return Response({
                    "error": f"OTP already sent. Please wait {wait_time} more seconds."
                }, status=429)
        except EmailOTP.DoesNotExist:
            pass

        otp = f"{random.randint(100000, 999999)}"
        EmailOTP.objects.update_or_create(
            email=email,
            defaults={'otp': otp, 'created_at': now, 'purpose': 'payment'}
        )

        send_mail(
            subject="Your Payment OTP",
            message=f"Use this OTP to complete your purchase: {otp}\nValid for 5 minutes.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({"message": "Payment OTP sent to your email."})

    
class VerifyPaymentOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = request.data.get('otp')
        email = request.user.email

        try:
            record = EmailOTP.objects.get(email=email, purpose='payment')
            if record.otp != otp:
                return Response({"error": "Invalid OTP."}, status=400)
            if record.is_expired():
                return Response({"error": "OTP has expired."}, status=400)
            record.delete()  # Optional: OTP used, remove it
            request.session['otp_verified'] = True
            return Response({"verified": True})
        except EmailOTP.DoesNotExist:
            return Response({"error": "OTP not found."}, status=400)


class ReportedUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = UserReport.objects.all().order_by("-timestamp")
        serializer = UserReportSerializer(reports, many=True)
        return Response(serializer.data)

class ReportUserView(APIView):
    permission_classes = [IsAuthenticated]  # ✅ Secure the endpoint

    def post(self, request, user_id):
        reason = request.data.get("reason")
        custom_reason = request.data.get("custom_reason")

        if not reason:
            return Response({"error": "Reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        reported_user = User.objects.filter(id=user_id).first()
        if not reported_user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        report = UserReport.objects.create(
            reported_user=reported_user,
            reporter=request.user,  # ✅ FIXED: was "reported_by"
            reason=reason,
            custom_reason=custom_reason if reason == "Other" else None
        )

        return Response({"message": "User reported successfully."}, status=status.HTTP_201_CREATED)



class ResolveUserReportsView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        UserReport.objects.filter(reported_user_id=user_id).update(status="resolved")
        return Response({"message": "Reports marked as resolved."})



class DeleteUserAndDataView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)

            # Mark reports as deleted
            UserReport.objects.filter(reported_user=user).update(status="deleted")

            # Delete associated data
            Post.objects.filter(user=user).delete()
            Profile.objects.filter(user=user).delete()
            user.delete()

            return Response({"message": "User and data deleted."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

class UserReportLogsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .serializer import UserReportSerializer
        all_reports = UserReport.objects.all().order_by("-timestamp")
        serializer = UserReportSerializer(all_reports, many=True)
        return Response(serializer.data)

