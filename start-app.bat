@echo off
echo ========================================================
echo Starting LandStack Platform (Backend + Frontend)
echo ========================================================

set JAVA_HOME=%LOCALAPPDATA%\Programs\Java\jdk-21.0.12.1+1
set PATH=%JAVA_HOME%\bin;%LOCALAPPDATA%\Programs\Maven\apache-maven-3.9.9\bin;%PATH%

echo [1/2] Starting Spring Boot Backend (Port 8080)...
start "LandStack Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [2/2] Starting React Frontend (Port 5173)...
start "LandStack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo Both services are starting in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo ========================================================
