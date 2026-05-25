from django.shortcuts import render


def game(request):
    return render(request, 'games/explorer_maze/game.html')
