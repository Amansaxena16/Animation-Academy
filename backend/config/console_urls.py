"""The admin console API, under /api/v1/admin/ (staff only). Django's own admin is at
/django-admin/."""

from django.urls import path

from students import console as s
from website import console as w

app_name = "console"

urlpatterns = [
    path("dashboard/", s.AdminDashboardView.as_view(), name="dashboard"),
    # Enrollments
    path("enrollments/", s.AdminEnrollmentListView.as_view(), name="enrollments"),
    path("enrollments/<str:code>/", s.AdminEnrollmentDetailView.as_view(), name="enrollment"),
    path(
        "enrollments/<str:code>/approve/",
        s.AdminEnrollmentApproveView.as_view(),
        name="enrollment-approve",
    ),
    path(
        "enrollments/<str:code>/reject/",
        s.AdminEnrollmentRejectView.as_view(),
        name="enrollment-reject",
    ),
    path(
        "enrollments/<str:code>/complete/",
        s.AdminEnrollmentCompleteView.as_view(),
        name="enrollment-complete",
    ),
    # Students
    path("students/", s.AdminStudentListView.as_view(), name="students"),
    path("students/<str:code>/", s.AdminStudentDetailView.as_view(), name="student"),
    path(
        "students/<str:code>/reset-password/",
        s.AdminStudentResetPasswordView.as_view(),
        name="student-reset-password",
    ),
    # Certificates
    path("certificates/", s.AdminCertificateListView.as_view(), name="certificates"),
    path(
        "certificates/<str:code>/pdf/", s.AdminCertificatePDFView.as_view(), name="certificate-pdf"
    ),
    # Courses
    path("courses/", w.AdminCourseListView.as_view(), name="courses"),
    path("courses/<slug:slug>/", w.AdminCourseDetailView.as_view(), name="course"),
    path("courses/<slug:slug>/image/", w.AdminCourseImageView.as_view(), name="course-image"),
    # Announcements
    path("announcements/", w.AdminAnnouncementListView.as_view(), name="announcements"),
    path("announcements/<int:pk>/", w.AdminAnnouncementDetailView.as_view(), name="announcement"),
    # Website content and settings
    path("site/", w.AdminSiteView.as_view(), name="site"),
    # Contact messages
    path("contact-messages/", w.AdminContactMessageListView.as_view(), name="contact-messages"),
    path(
        "contact-messages/<int:pk>/",
        w.AdminContactMessageDetailView.as_view(),
        name="contact-message",
    ),
]
