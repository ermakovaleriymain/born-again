from django.urls import path

from . import views

app_name = 'flappy_bat'

urlpatterns = [
    path('', views.game, name='game'),
]
