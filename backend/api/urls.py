from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter
from .views import PostViewSet, LimitedCommentsView, AllCommentsView, ReportPostView, ReportListView, ResolveReport, TakeDownPost, CreateGroupView, GroupListView, GroupChatMessageView 

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)

urlpatterns = [
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='auth_register'),
    path('test/', views.testEndPoint, name='test'),
    path('', views.getRoutes),

    #OTP Verification
    path("send-otp/", views.SendOTPView.as_view(), name="send_otp"),
    path("verify-otp/", views.VerifyOTPView.as_view(), name="verify_otp"),


    # Chat/Text Messaging Functionality
    path("get-messages/<sender_id>/<reciever_id>/", views.GetMessages.as_view()),
    path("send-messages/", views.SendMessages.as_view()),

    # Post 
    path("react/", views.ReactToPost.as_view(), name="react_post"),
    path("comment/", views.AddComment.as_view(), name="add_comment"),
    path('comments/limited/<int:post_id>/', LimitedCommentsView.as_view(), name='limited_comments'),
    path('comments/all/<int:post_id>/', AllCommentsView.as_view(), name='all_comments'),

    # Get profile
    path("profile/<int:pk>/", views.ProfileDetail.as_view(), name="profile_detail"),
    path("search/<username>/", views.SearchUser.as_view()),

    #Admin routes
    path('admin-dashboard/', views.AdminDashboard.as_view(), name='admin_dashboard'),
    path('toggle-verification/<int:profile_id>/', views.ToggleUserVerification.as_view(), name='toggle_verification'),
    path("admin/verification-pending/", views.PendingVerificationsView.as_view(), name="pending_verifications"),



    path("friends/", views.FriendListView.as_view(), name="friend_list"),
    path("friend-requests/", views.PendingFriendRequestsView.as_view(), name="pending_friend_requests"),
    path("friend-requests/send/", views.SendFriendRequestView.as_view(), name="send_friend_request"),
    path("friend-requests/respond/<int:request_id>/", views.RespondFriendRequestView.as_view(), name="respond_friend_request"),
    path("all-users/", views.AllUsersListView.as_view(), name="all_users"),
    path("profile/<int:user_id>/verify/", views.ProfileVerificationUploadView.as_view(), name="upload_govt_doc"),

    path('create-group/', views.CreateGroupView.as_view(), name='create_group'),
    path('groups/', GroupListView.as_view(), name='group_list'),

    path('groups/<int:group_id>/messages/', GroupChatMessageView.as_view()),

    path('report/', ReportPostView.as_view(), name='report_post'),
    path('admin/reports/', ReportListView.as_view(), name='admin_reports'),
    path('admin/resolve-report/<int:report_id>/', views.ResolveReport.as_view(), name="resolve_report"),
    path('admin/take-down-post/<int:report_id>/', views.TakeDownPost.as_view(), name="take_down_post"),

    path('public-profile/<int:user_id>/', views.public_profile_view),

]

urlpatterns += router.urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
