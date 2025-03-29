from django.contrib import admin
from .models import User, Profile, ChatMessage, FriendRequest
import base64
import os



class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email']

class ProfileAdmin(admin.ModelAdmin):
    list_editable = ['verified']
    list_display = ['user', 'full_name', 'verified']

class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'reciever', 'is_read', 'message', 'date']
    list_editable = ['is_read']
    readonly_fields = ['decrypted_message']

    def decrypted_message(self, obj):
        """Decrypt the message for display in admin panel."""
        cipher = Fernet(ENCRYPTION_KEY)
        return cipher.decrypt(obj.encrypted_message).decode()

    decrypted_message.short_description = "Decrypted Message"

class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'status', 'timestamp']
    list_filter = ['status']
    search_fields = ['from_user__username', 'to_user__username']

admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)
admin.site.register(FriendRequest, FriendRequestAdmin)
