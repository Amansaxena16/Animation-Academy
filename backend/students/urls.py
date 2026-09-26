from django.urls import path

from . import views

app_name = "students"

urlpatterns = [
    path("admissions/validate/", views.AdmissionStepView.as_view(), name="admission-validate"),
    path("admissions/", views.AdmissionView.as_view(), name="admission"),
    path("me/dashboard/", views.DashboardView.as_view(), name="me-dashboard"),
    path("me/profile/", views.ProfileView.as_view(), name="me-profile"),
    path("me/enrollments/", views.MyEnrollmentsView.as_view(), name="me-enrollments"),
]
