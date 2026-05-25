"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('', include('apps.desktop.urls')),
    path('games/file-hunt/', include('apps.games.file_hunt.urls')),
    path('games/flappy-bat/', include('apps.games.flappy_bat.urls')),
    path('games/memory-cards/', include('apps.games.memory_cards.urls')),
    path('games/antivirus/', include('apps.games.antivirus.urls')),
    path('games/cmd/', include('apps.games.cmd_game.urls')),
    path('games/explorer-maze/', include('apps.games.explorer_maze.urls')),
    path('admin/', admin.site.urls),
]
