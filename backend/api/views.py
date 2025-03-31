from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Q, Subquery, OuterRef
from api.models import User, Profile, ChatMessage, FriendRequest, EmailOTP

from api.serializer import MyTokenObtainPairSerializer, RegisterSerializer, UserSerializer, ProfileSerializer, MessageSerializer, FriendRequestSerializer, SimpleProfileSerializer, SendOTPSerializer, VerifyOTPSerializer

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


from rest_framework.generics import ListAPIView
from api.models import Comment, Report
from api.serializer import CommentSerializer, ProfileVerifySerializer, VerificationPendingProfileSerializer, ReportSerializer
import random
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.parsers import MultiPartParser, FormParser



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
            post = report.post 
            post.delete()  # Take down the post by deleting it

            # Mark the report as taken down (we could also add a status field in the report model to track this)
            report.status = 'taken_down'
            report.save()

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
