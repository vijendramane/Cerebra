@echo off
echo Setting up ML Research Agent Platform...
echo ========================================

echo.
echo Step 1: Setting up backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo Step 2: Setting up frontend...
cd frontend
npm install
cd ..

echo.
echo Step 3: Setting up environment...
copy .env.example .env

echo.
echo ========================================
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file and add your API keys:
echo    - Google AI Studio: https://makersuite.google.com/app/apikey
echo    - Groq Console: https://console.groq.com/keys
echo.
echo 2. Start PostgreSQL and Redis (or use Docker)
echo.
echo 3. Start the application:
echo    - With Docker: docker-compose up --build
echo    - Without Docker:
echo      Backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo      Frontend: cd frontend ^&^& npm run dev
echo.
echo 4. Access the application:
echo    - Frontend: http://localhost:3000
echo    - API: http://localhost:8000
echo    - API Docs: http://localhost:8000/docs
pause