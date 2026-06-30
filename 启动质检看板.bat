@echo off
chcp 65001 >nul 2>&1
title 质检培训看板
cd /d "%~dp0"
echo.
echo  ========================================
echo   质检培训看板 V2
echo   正在打开浏览器...
echo  ========================================
echo.
start "" "index.html"
