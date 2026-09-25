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


class IsOwner(BasePermission):
    """Object-level: the object belongs to the requesting user.

    Objects expose their owner through `user`, `student.user` or an `owner_user` property.
    """

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "owner_user", None)
        if owner is None:
            owner = getattr(obj, "user", None)
        if owner is None and getattr(obj, "student", None) is not None:
            owner = obj.student.user
        return owner is not None and owner == request.user
