from django.urls import path

from . import views

app_name = 'memory_cards'

urlpatterns = [
    path('', views.game, name='game'),
]
