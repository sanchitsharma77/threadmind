# threadmind

A local, privacy-first Instagram DM Concierge system.

## Features
- FastAPI backend (Python 3.11+)
- Vite + React + Tailwind frontend
- All data stored locally in JSON files (no external APIs)
- MCP/Claude integration for Instagram DM automation
- Dashboard for managing templates, targets, tags, and logs
- Manual and scheduled DM poller

## Quick Start (for Forks/Clones)

### 1. Clone the repository
```sh
git clone <YOUR_GIT_URL>
cd threadmind
```

### 2. Install backend dependencies
```sh
pip install -r requirements.txt
```

### 3. Install frontend dependencies
```sh
cd frontend
npm install
# or bun install
```

### 4. Run the backend
```sh
cd ..
uvicorn main:app --reload --port 8000
# or use ./start.sh to start both backend and frontend automatically
```

### 5. Run the frontend
```sh
cd frontend
npm run dev
# or bun dev
```

### 6. Open the dashboard
Go to [http://localhost:5173](http://localhost:5173)

### 7. Run the poller manually (for demo/testing)
```sh
python tasks/run_poller_once.py
```
Or use the "Run Poller Now" button in the dashboard.

## Configuration
- All data is stored in the `data/` directory as JSON files.
- MCP/Claude integration is local-only and privacy-first.
- Backend runs on port 8000, frontend on 5173 by default.

## Privacy
- No data leaves your machine. No external APIs or cloud storage.

## Customization
- Update templates, targets, and tags via the dashboard.
- Replace `frontend/public/favicon.ico` with your own branding.
- Edit `frontend/index.html` for further branding.

## Contributing
PRs and forks welcome! See code comments for extension points.

---

**threadmind** is designed for local, private, and bug-free DM automation. Fork, customize, and use with confidence!
