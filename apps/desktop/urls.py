from django.urls import path

from . import views

app_name = 'desktop'

urlpatterns = [
    path('', views.desktop, name='desktop'),
    path('windows/<slug:window_id>/', views.window_content, name='window_content'),
]
