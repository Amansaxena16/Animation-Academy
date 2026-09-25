from django.urls import path

from . import views

app_name = "students"

urlpatterns = [
    path("admissions/validate/", views.AdmissionStepView.as_view(), name="admission-validate"),
    path("admissions/", views.AdmissionView.as_view(), name="admission"),
]
