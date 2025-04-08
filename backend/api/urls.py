from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter
from .views import PostViewSet, LimitedCommentsView, AllCommentsView, ReportPostView, ReportListView, ResolveReport, TakeDownPost, CreateGroupView, GroupListView, GroupChatMessageView , GroupDetailView, ReportUserView, ReportedUsersView, ResolveUserReportsView, DeleteUserAndDataView, UserReportLogsView

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import SellerListingsAPI, ListingDetailAPI
from .views import MarketplaceListAPI
from .views import BuyerMarketplaceAPI
from .views import CreateListingAPI

from .views import process_payment, get_wallet_balance



from .views import (
    CartView,
    CheckoutView,
    OrderDetailsView,
    AddressView,
    SendPaymentOTPView,
    VerifyPaymentOTPView
)

from .views import SellerProfileView

from .views import (
    BuyerProfileView, AddressListCreateView, AddressDetailView, SetDefaultAddressView,
    PaymentMethodListCreateView, PaymentMethodDetailView, SetDefaultPaymentMethodView,
    OrderListView, RecentOrdersView, OrderDetailView, OrderHistoryView, TrackOrderView,
    UpdateOrderStatusView, WishlistListView, WishlistDetailView, EligibleReturnOrdersView,
    ReturnRequestListCreateView, ReturnRequestDetailView, CancelReturnRequestView,
    TransactionListView, InvoiceListView, DownloadInvoiceView, BuyerDashboardStatsView
)

from .views import PublicProductListView


from .views import send_payment_otp, verify_payment_otp, confirm_payment

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
    path("groups/<int:pk>/", views.GroupDetailView.as_view(), name="group-detail"),

    path('report/', ReportPostView.as_view(), name='report_post'),
    path('admin/reports/', ReportListView.as_view(), name='admin_reports'),
    path('admin/resolve-report/<int:report_id>/', views.ResolveReport.as_view(), name="resolve_report"),
    path('admin/take-down-post/<int:report_id>/', views.TakeDownPost.as_view(), name="take_down_post"),

    path('public-profile/<int:user_id>/', views.public_profile_view),

    #P2P
    path('seller/listings/<int:pk>/', views.ListingDetailAPI.as_view(), name='seller-listing-detail'),
    path('marketplace/', views.MarketplaceListAPI.as_view(), name='marketplace-list'),
    path('marketplace/buyer/', views.BuyerMarketplaceAPI.as_view(), name='buyer-marketplace'),
    path('seller/dashboard/', views.SellerDashboardAPI.as_view()),
    
    # Seller orders endpoints
    path('seller/orders/', views.SellerOrdersAPI.as_view(), name='seller-orders'),
    path('seller/orders/<int:pk>/', views.SellerOrderDetailAPI.as_view(), name='seller-order-detail'),
    
    # Seller stats endpoint
    path('seller/stats/', views.SellerStatsAPI.as_view(), name='seller-stats'),
    
    # Withdrawal endpoint
    path('seller/withdraw/', views.WithdrawalAPI.as_view(), name='seller-withdraw'),
  

    # Buyer Profile
    path('profile/', BuyerProfileView.as_view(), name='buyer-profile'),
    # Buyer View Individual Product
path('buyer/products/<int:pk>/', views.PublicListingDetailAPI.as_view(), name='buyer-product-detail'),

    
    # Addresses
    path('addresses/', AddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='address-detail'),
    path('addresses/<int:pk>/set-default/', SetDefaultAddressView.as_view(), name='set-default-address'),
    
    # Payment Methods
    path('process-payment/', process_payment, name='process-payment'),
    path('my-wallet/', get_wallet_balance, name='get-wallet'),
    path('payment-methods/', PaymentMethodListCreateView.as_view(), name='payment-method-list'),
    path('payment-methods/<int:pk>/', PaymentMethodDetailView.as_view(), name='payment-method-detail'),
    path('payment-methods/<int:pk>/set-default/', SetDefaultPaymentMethodView.as_view(), name='set-default-payment-method'),
    
    # Orders
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/recent/', RecentOrdersView.as_view(), name='recent-orders'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/history/', OrderHistoryView.as_view(), name='order-history'),
    path('orders/track/<pk>/', TrackOrderView.as_view(), name='track-order'),
    path('orders/<int:pk>/update-status/', UpdateOrderStatusView.as_view(), name='update-order-status'),
    
    # Wishlist
    path('wishlist/', WishlistListView.as_view(), name='wishlist-list'),
    path('wishlist/<int:pk>/', WishlistDetailView.as_view(), name='wishlist-detail'),
    
    # Returns & Refunds
    path('returns/eligible-orders/', EligibleReturnOrdersView.as_view(), name='eligible-return-orders'),
    path('returns/', ReturnRequestListCreateView.as_view(), name='return-request-list'),
    path('returns/<int:pk>/', ReturnRequestDetailView.as_view(), name='return-request-detail'),
    path('returns/<int:pk>/cancel/', CancelReturnRequestView.as_view(), name='cancel-return-request'),
    
    # Transactions & Invoices
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/download/', DownloadInvoiceView.as_view(), name='download-invoice'),

    path('seller/listings/create/', CreateListingAPI.as_view(), name='create-listing'),
    path('seller/listings/', SellerListingsAPI.as_view(), name='seller-listings'),
    path('buyer/products/', PublicProductListView.as_view(), name='buyer-products'),
    path('listings/<int:pk>/', views.PublicListingDetailAPI.as_view(), name='listing-detail'),

    
    # Dashboard Stats
    path('stats/', BuyerDashboardStatsView.as_view(), name='buyer-stats'),
    path('api/seller-profile/', SellerProfileView.as_view(), name='seller-profile'),

    path('api/send-payment-otp/', send_payment_otp),
    path('api/verify-payment-otp/', verify_payment_otp),
    path('api/confirm-payment/', confirm_payment),

    # path('api/cart/', CartView.as_view(), name='cart'),
    path('cart/', CartView.as_view(), name='cart'),              # GET, POST
    path('cart/<int:pk>/', CartView.as_view(), name='cart-item'), 

    # path('cart/<int:pk>/', CartView.as_view(), name='cart-item'),
    path('buyer/checkout/', CheckoutView.as_view(), name='checkout'),

    path('orders/<int:id>/', OrderDetailsView.as_view(), name='order-details'),
    path('addresses/', AddressView.as_view(), name='address-list'),
    path('send-payment-otp/', SendPaymentOTPView.as_view(), name='send_payment_otp'),
path('verify-payment-otp/', VerifyPaymentOTPView.as_view(), name='verify_payment_otp'),


    path("reported-users/", views.ReportedUsersView.as_view(), name="reported_users"),
    path("report-user/<int:user_id>/", ReportUserView.as_view()),
    path("admin/resolve-user/<int:user_id>/", ResolveUserReportsView.as_view(), name="resolve_user_reports"),
    path("admin/delete-user/<int:user_id>/", DeleteUserAndDataView.as_view(), name="delete_user_and_data"),
    path("admin/user-report-logs/", UserReportLogsView.as_view(), name="user_report_logs"),


]


urlpatterns += router.urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
