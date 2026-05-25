from django.urls import path

from . import views

app_name = 'explorer_maze'

urlpatterns = [
    path('', views.game, name='game'),
]
