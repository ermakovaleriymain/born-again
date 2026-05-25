from django.urls import path

from . import views

app_name = 'antivirus'

urlpatterns = [
    path('', views.game, name='game'),
]
