from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Wallet

from .models import Transaction, Wallet, SellerProfile

@receiver(post_save, sender=Transaction)
def handle_successful_transaction(sender, instance, created, **kwargs):
    if created and instance.success:
        seller = instance.receiver
        amount = instance.amount

        try:
            wallet, _ = Wallet.objects.get_or_create(user=seller)
            wallet.balance += amount
            wallet.save()

            seller_profile, _ = SellerProfile.objects.get_or_create(user=seller)
            seller_profile.total_earnings += amount
            seller_profile.save()

            print(f"[SIGNAL] Seller '{seller.username}' updated: +₹{amount}")

        except Exception as e:
            print(f"[SIGNAL ERROR] Failed to update seller balance: {e}")


@receiver(post_save, sender=User)
def create_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance, balance=10000.0)
