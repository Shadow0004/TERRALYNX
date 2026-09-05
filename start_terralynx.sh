#!/bin/bash

echo "============================================================"
echo "   TERRALYNX - DISASTER RESPONSE DECISION INTELLIGENCE   "
echo "   Predict. Prepare. Protect.                              "
echo "============================================================"

# --- 1. DYNAMIC PATH SETUP ---
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$BASE_DIR/frontend"
BACKEND_DIR="$BASE_DIR/backend"

echo -e "\033[90mProject Directory Detected: $BASE_DIR\033[0m"

# --- 2. PYTHON VERIFICATION ---
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "\n\033[31m[ERROR] Python is not installed or not in PATH!\033[0m"
    echo -e "\033[33mPlease ensure Python 3 is installed.\033[0m"
    exit 1
fi

# --- 3. NODE / NPM VERIFICATION ---
if ! command -v npm &>/dev/null; then
    echo -e "\n\033[31m[ERROR] Node.js / npm is not installed or not in PATH!\033[0m"
    echo -e "\033[33mDownload Node.js from https://nodejs.org and restart VS Code.\033[0m"
    exit 1
fi

# --- 4. BACKEND DEPENDENCY CHECKER ---
echo -e "\n\033[32m[1/4] Checking Python Backend Dependencies...\033[0m"
if [ -f "$BASE_DIR/requirements.txt" ]; then
    REQ_PATH="$BASE_DIR/requirements.txt"
elif [ -f "$BACKEND_DIR/requirements.txt" ]; then
    REQ_PATH="$BACKEND_DIR/requirements.txt"
else
    REQ_PATH=""
fi

if [ -n "$REQ_PATH" ]; then
    echo -e "\033[36mInstalling dependencies from: $REQ_PATH\033[0m"
    $PYTHON_CMD -m pip install -r "$REQ_PATH"
    
    if [ $? -ne 0 ]; then
        echo -e "\n\033[31m[ERROR] Python dependency installation failed!\033[0m"
        exit 1
    fi
    echo -e "\033[32mBackend dependencies are up to date.\033[0m"
else
    echo -e "\033[31mWarning: No requirements.txt found anywhere! Your backend might crash.\033[0m"
fi

# --- 5. FRONTEND DEPENDENCY CHECKER ---
echo -e "\n\033[32m[2/4] Checking React/Vite Frontend Dependencies...\033[0m"
if [ -f "$FRONTEND_DIR/package.json" ]; then
    cd "$FRONTEND_DIR" || exit
    if [ ! -d "node_modules" ]; then
        echo -e "\033[33mnode_modules missing. Installing npm packages...\033[0m"
        npm install
    else
        npm install --prefer-offline --no-audit > /dev/null 2>&1
    fi

    if [ $? -ne 0 ]; then
        echo -e "\n\033[31m[ERROR] npm install encountered an error!\033[0m"
        exit 1
    fi
    echo -e "\033[32mFrontend dependencies are up to date.\033[0m"
else
    echo -e "\033[33mWarning: No package.json found in the frontend folder. Skipping...\033[0m"
fi

# --- 6. START SERVERS ---
echo -e "\n\033[32m[3/4] Starting FastAPI Backend on http://localhost:8000 ...\033[0m"
cd "$BASE_DIR" || exit
# Run backend in the background
$PYTHON_CMD -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &

sleep 2

echo -e "\033[32m[4/4] Starting React + Vite Frontend on http://localhost:5173 ...\033[0m"
cd "$FRONTEND_DIR" || exit
# Run frontend in the background
npm run dev &

# --- 7. SUCCESS SCREEN ---
echo -e "\n\033[36m============================================================\033[0m"
echo -e "\033[32mTerraLynx is now running!\033[0m"
echo -e "\033[37mCommand Center UI: http://localhost:5173\033[0m"
echo -e "\033[37mAPI Documentation: http://localhost:8000/docs\033[0m"
echo -e "\033[36m============================================================\033[0m"

# Wait for background processes to keep the terminal open
wait
