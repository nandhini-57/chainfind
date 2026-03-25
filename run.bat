@echo off
echo Starting ChainFind Backend...
cd /d "c:\Users\Nandhini\OneDrive\Attachments\my projects\lost&found3\chainfind\backend"
start "Backend" cmd /k "python main.py"
echo.
echo Starting Frontend...
cd /d "c:\Users\Nandhini\OneDrive\Attachments\my projects\lost&found3\chainfind\frontend"
call npm run dev
pause

