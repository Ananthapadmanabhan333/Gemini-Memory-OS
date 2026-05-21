@echo off
title Gemini Memory OS - Deployer Control
echo ==============================================================
echo           GEMINI MEMORY OS - DEPLOYER AND INITIALIZER
echo ==============================================================
echo [1/4] checking environment configurations...
cd ..
if not exist "backend\.env" (
    echo Creating default backend local environment configs...
    echo PROJECT_NAME=Gemini Memory OS > backend\.env
    echo VERSION=1.0.0 >> backend\.env
    echo USE_MOCK_LLM=true >> backend\.env
    echo DATABASE_URL=sqlite:///./gemini_memory_os.db >> backend\.env
    echo USE_LOCAL_VECTOR_STORE=true >> backend\.env
    echo USE_LOCAL_GRAPH_STORE=true >> backend\.env
)

echo [2/4] setting up python virtual environments...
cd backend
python -m venv venv
call venv\Scripts\activate
echo installing backend dependency libraries...
pip install -r requirements.txt

echo [3/4] initiating unit test validations...
echo running pytest suites...
python -m pytest tests/test_memory_os.py -v

echo [4/4] launching Gemini Memory OS...
echo starting backend FastAPI service on port 8000 (separate window)...
start cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo starting frontend Next.js dashboard service on port 3000 (separate window)...
cd ..\frontend
echo installing node package models...
call npm install
start cmd /k "npm run dev"

echo ==============================================================
echo    GEMINI MEMORY OS COCKPIT LAUNCHED SUCCESSFULLY
echo    Backend running at: http://localhost:8000
echo    Frontend running at: http://localhost:3000
echo ==============================================================
pause
