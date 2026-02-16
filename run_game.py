#!/usr/bin/env python3
"""Launch the FPS demo with a local web server and open it in a browser."""

from __future__ import annotations

import argparse
import http.server
import os
import socketserver
import sys
import webbrowser
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the FPS demo locally.")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically open a browser tab",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    project_root = Path(__file__).resolve().parent
    index_file = project_root / "index.html"

    if not index_file.exists():
        print("Error: index.html was not found next to run_game.py.", file=sys.stderr)
        return 1

    url = f"http://127.0.0.1:{args.port}"

    # Serve files from the project root even if launched from another directory.
    os.chdir(project_root)

    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("", args.port), handler) as httpd:
            print(f"Serving {project_root} at {url}")
            print("Press Ctrl+C to stop.")

            if not args.no_browser:
                webbrowser.open(url)

            httpd.serve_forever()
    except OSError as exc:
        print(f"Could not start server on port {args.port}: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nShutting down server.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
