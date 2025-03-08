from django.contrib import admin
from .models import User, Profile, ChatMessage
from cryptography.fernet import Fernet
import base64
import os

ENCRYPTION_KEY = b'A854WEExfNlYfIZ163129WqBXJw671H24KpdR2m1y2o='


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

admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)