@echo off
echo ===================================================
echo Welcome to NexCommand - Rapid Crisis Response Platform
echo ===================================================
echo.
echo Installing required dependencies (this may take a moment)...
call npm install

echo.
echo Starting the NexCommand development server...
echo Once started, open your browser and navigate to the Local URL provided below (usually http://localhost:5173/)
echo.
call npm run dev

pause
