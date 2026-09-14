# Server statico del gioco: come `python3 -m http.server`, ma chiede al browser di non tenere i file in cache.
# Senza, dopo una modifica il browser può continuare a usare i vecchi moduli JS anche ricaricando la pagina.
from http.server import SimpleHTTPRequestHandler, test


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    test(HandlerClass=NoCacheHandler, port=8000)
