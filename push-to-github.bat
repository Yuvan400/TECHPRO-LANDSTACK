@echo off
title Push LandStack to GitHub
setlocal EnableDelayedExpansion
cd /d "%~dp0"
if exist "landsih26-main" cd landsih26-main

echo ========================================================
echo   LANDSTACK — PUSH ALL CODE TO GITHUB
echo   Repository: https://github.com/Yuvan400/TECHPRO-LANDSTACK
echo ========================================================
echo.
echo Attempting to push code...
echo.

git push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: All code successfully pushed to GitHub!
    echo   https://github.com/Yuvan400/TECHPRO-LANDSTACK
    echo ========================================================
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================================
echo   Authentication required by GitHub!
echo ========================================================
echo.
echo If your browser did not open automatically, you can paste
echo your GitHub Personal Access Token (PAT) below to push.
echo.
echo (To create a token: GitHub -> Settings -> Developer settings
echo  -> Personal access tokens -> Tokens (classic) -> Generate
echo  -> select 'repo' scope)
echo.
set /p "GHTOKEN=Enter GitHub Personal Access Token (or press Enter to cancel): "

if "%GHTOKEN%"=="" (
    echo Push cancelled.
    pause
    exit /b 1
)

echo.
echo Pushing with provided token...
git push -u https://%GHTOKEN%@github.com/Yuvan400/TECHPRO-LANDSTACK.git main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: All code successfully pushed to GitHub!
    echo   https://github.com/Yuvan400/TECHPRO-LANDSTACK
    echo ========================================================
) else (
    echo.
    echo Push failed. Please check that the token has 'repo' permissions for Yuvan400/TECHPRO-LANDSTACK.
)

echo.
pause
