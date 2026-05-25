from django.shortcuts import render


def game(request):
    photos = [
        'img/memory/memory_01.jpeg',
        'img/memory/memory_02.png',
        'img/memory/memory_03.png',
        'img/memory/memory_04.jpeg',
        'img/memory/memory_05.jpeg',
        'img/memory/memory_06.jpeg',
        'img/memory/memory_07.jpeg',
        'img/memory/memory_08.jpeg',
    ]
    return render(request, 'games/memory_cards/game.html', {'photos': photos})
