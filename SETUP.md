# New Laptop Setup Guide (Kannada SER)

This guide is for running the project on a fresh laptop (Windows).

## 1. Prerequisites

Install these first:
- Git
- Python 3.10+
- Node.js 18+
- MongoDB Community Server
- FFmpeg (recommended)

Optional (recommended):
- VS Code

### Quick install via winget (PowerShell as Administrator)

```powershell
winget install --id Git.Git -e
winget install --id Python.Python.3.10 -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id MongoDB.Server -e
winget install --id Gyan.FFmpeg -e
```

After install, restart terminal.

## 2. Get Project Code

```powershell
git clone <YOUR_REPO_URL>
cd "kannada speech recog"
```

If you already copied the folder manually, just open terminal in the project root.

## 3. Backend Setup

```powershell


# Navigate to backend
cd backend

# Activate venv
.\.venv310\Scripts\Activate.ps1


pip install --upgrade pip
pip install -r requirements.txt

# Verify activation (you should see (.venv310) in prompt)
python --version

# Start backend server
python app.py
```

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=kannada_ser

JWT_SECRET=change-me-in-production
JWT_EXPIRY_DAYS=7

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

DEBUG=true
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173

INFERENCE_MODE=wav2vec2
HF_API_TOKEN=
```

Notes:
- Cloudinary values are required if you want audio upload URLs/history playback.
- On first backend run, model assets are downloaded once and cached locally.

## 4. Frontend Setup

Open a new terminal:

```powershell


cd frontend
npm run dev



npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## 5. Start MongoDB

If MongoDB is installed as a service, ensure it is running.

Quick check:

```powershell
Get-Service *mongo*
```

If needed:

```powershell
Start-Service MongoDB
```

## 6. Start Project (Manual)

Terminal 1 (backend):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

Terminal 2 (frontend):

```powershell
cd frontend
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health: http://127.0.0.1:5000/api/health

## 7. Start Project (One Command)

From project root:

```powershell
.\start_project.ps1
```

This opens two PowerShell windows:
- backend server
- frontend dev server

## 8. First-Run Behavior

On first backend startup, the model bootstrap may take time because it downloads and stores local model assets under:
- `models/processor/`
- `models/wav2vec2_base/`

After that, startup is faster and local-only for those assets.

## 9. Common Issues

### Python not found
Install Python and reopen terminal. Verify:

```powershell
python --version
```

### npm not found
Install Node.js LTS and reopen terminal. Verify:

```powershell
node -v
npm -v
```

### Backend exits immediately
- Confirm `backend/.env` exists
- Confirm venv is active and requirements installed
- Run from `backend` folder

### 401 Unauthorized
Login first from frontend; protected endpoints need JWT token.

### Audio conversion fails
Ensure FFmpeg is installed and available in PATH.
