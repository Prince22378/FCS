from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Wallet, SellerProfile, BuyerProfile, Profile

User = get_user_model()

@receiver(post_save, sender=User)
def create_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(user=instance, defaults={'balance': 10000.0})
        print(f"✅ Wallet created for {instance.email}")


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile, _ = Profile.objects.get_or_create(user=instance)
        BuyerProfile.objects.get_or_create(user=instance)
        SellerProfile.objects.get_or_create(user=instance)

        if not profile.full_name:
            profile.full_name = instance.username
            profile.save()

        print(f"✅ Profiles created for {instance.email}")

