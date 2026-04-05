from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
   
    list_display = ('email', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('email',)
    ordering = ('email',)
    
    # The fields to be used in editing the User model.
    # This is required for the 'add user' and 'change user' pages.
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # The fields to be used when creating a new user.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email','password1', 'password2', 'is_staff', 'is_active'),
        }),
    )

# Now register the new UserAdmin...
admin.site.register(User, UserAdmin)