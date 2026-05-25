from django.shortcuts import render


def game(request):
    return render(request, 'games/flappy_bat/game.html')
