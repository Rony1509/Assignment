# Simple News Portal (JSON-Server + Frontend)

This is a small single-file frontend (SPA) that talks to a JSON-Server mock backend to implement a simple news portal with simulated login.

Run steps
1. Open a bash terminal in the project folder (where `db.json` is located):

```bash
# Start JSON-Server on port 3000 (watches db.json)
npx json-server --watch db.json --port 3000
```

2. Serve the frontend directory as static files. You can use `http.server` (Python) or `http-server` (npm) or open the file directly, but using a static server is recommended.

Using Node `http-server`:
```bash
npx http-server . -p 5500
# then open http://localhost:5500/index.html#login
```

Or using Python 3:
```bash
python -m http.server 5500
# then open http://localhost:5500/index.html#login
```

Usage
- Go to `#login` and select a user to simulate login.
- Create news, edit or delete news you authored, and add comments as the logged-in user.

API endpoints used (JSON-Server):
- `GET /users`
- `GET /news`
- `GET /news/:id`
- `POST /news`
- `PATCH /news/:id`
- `DELETE /news/:id`

Validation rules enforced on frontend:
- Title cannot be empty.
- Body must be at least 20 characters.
- Comment cannot be empty.

Notes
- JSON-Server must run on port 3000 (the frontend points to http://localhost:3000).
- This is a minimal educational app. No real authentication is used — login is simulated.
# Assignment
