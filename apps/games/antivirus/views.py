from django.shortcuts import render


def game(request):
    return render(request, 'games/antivirus/game.html')
