"""Static server for the birthday game with caching disabled."""
import functools
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DIR = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=DIR)
    ThreadingHTTPServer(("", 8462), handler).serve_forever()
