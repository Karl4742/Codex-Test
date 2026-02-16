# Codex-Test

A basic first-person 3D prototype built with Three.js.

## Features

- WASD movement
- Mouse look (pointer lock)
- Jump with spacebar
- Collision with ground, all four room walls, and a center pillar
- Low-poly hand visible from the player perspective

## Quick launch

Run the launcher script:

```bash
python3 run_game.py
```

This starts a local web server and opens the game automatically at `http://127.0.0.1:8000`.

Optional flags:

```bash
python3 run_game.py --port 9000
python3 run_game.py --no-browser
```

## Manual run

If you prefer, you can still run a server manually:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.


## Troubleshooting

- `GET /favicon.ico 404` is harmless and does not affect gameplay.
- `ConnectionAbortedError [WinError 10053]` can happen when the browser tab closes while the local server is still sending data.
- If you stay on the start overlay, click the game window again and allow mouse/pointer lock when prompted by your browser.
