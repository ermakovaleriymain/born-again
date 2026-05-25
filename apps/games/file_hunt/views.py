from django.shortcuts import render


def game(request):
    return render(request, 'games/file_hunt/game.html')
