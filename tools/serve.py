# Локальный сервер для проверки на телефоне: запрещает браузеру кешировать файлы,
# чтобы телефон всегда получал последнюю версию кода.
# Запуск из любой папки: python3 tools/serve.py   (порт по умолчанию 8000)
import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# Раздаём только папку проекта, даже если команда запущена из другой папки
PROJECT_DIR = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(NoCacheHandler, directory=str(PROJECT_DIR))
    server = ThreadingHTTPServer(("", port), handler)
    print(f"Раздаётся папка {PROJECT_DIR}")
    print(f"На этом компьютере: http://localhost:{port}   Остановить: Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
