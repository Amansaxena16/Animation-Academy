from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    message = "This area is for students."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_student)


class IsAdmin(BasePermission):
    message = "This area is for institute staff."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin)
