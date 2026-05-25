from django.urls import path

from . import views

app_name = 'cmd_game'

urlpatterns = [
    path('', views.game, name='game'),
]
