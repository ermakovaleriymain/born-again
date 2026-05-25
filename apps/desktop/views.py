from django.http import Http404
from django.shortcuts import render

from .data import DESKTOP_ICONS, WINDOWS


def desktop(request):
    return render(
        request,
        'desktop/desktop.html',
        {
            'icons': DESKTOP_ICONS,
            'windows': WINDOWS,
        },
    )


def window_content(request, window_id):
    window = WINDOWS.get(window_id)
    if not window or 'template' not in window:
        raise Http404('Window content not found')
    return render(request, window['template'], {'window': window})
