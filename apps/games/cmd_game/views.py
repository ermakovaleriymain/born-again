from django.shortcuts import render


def game(request):
    return render(request, 'games/cmd_game/game.html')
