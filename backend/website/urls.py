from django.urls import path

from . import views

app_name = "website"

urlpatterns = [
    path("courses/", views.CourseListView.as_view(), name="course-list"),
    path("courses/categories/", views.CategoryListView.as_view(), name="course-categories"),
    path("courses/<slug:slug>/", views.CourseDetailView.as_view(), name="course-detail"),
    path("site/", views.SiteView.as_view(), name="site"),
    path("announcements/", views.AnnouncementListView.as_view(), name="announcements"),
    path("contact/", views.ContactView.as_view(), name="contact"),
]
