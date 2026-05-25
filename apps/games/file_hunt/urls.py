from django.urls import path

from . import views

app_name = 'file_hunt'

urlpatterns = [
    path('', views.game, name='game'),
]
