@echo off
chcp 936 >nul
title binboard - GitHub Pages 部署
echo ============================================
echo  binboard - GitHub Pages 一键部署
echo ============================================
echo.
echo 正在启动 PowerShell 部署脚本...
echo.
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-github.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 脚本执行出错，请尝试手动运行：
    echo   右键点击 deploy-github.ps1 - 使用 PowerShell 运行
    pause
)
