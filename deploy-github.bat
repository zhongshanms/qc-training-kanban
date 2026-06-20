@echo off
chcp 65001 >nul
title binboard - GitHub Pages 一键部署
echo ============================================
echo  质检培训看板 - GitHub Pages 部署脚本
echo ============================================
echo.

set GH="C:\Program Files\GitHub CLI\gh.exe"
set REPO_DIR=C:\Users\cr\ZCodeProject\binboard
set REPO_NAME=binboard
set GITHUB_USER=zhongshanms

echo 📁 目标仓库: %GITHUB_USER%/%REPO_NAME%
echo.

:: 1. 检查 gh CLI 是否已登录
echo 🔍 检查 GitHub CLI 认证状态...
%GH% auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  未登录 GitHub CLI，正在启动登录流程...
    echo.
    echo 请选择登录方式：
    echo   1. 浏览器登录（推荐）
    echo   2. Token 登录（需提前创建 PAT）
    echo.
    %GH% auth login
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 登录失败，请重试
        pause
        exit /b 1
    )
)
echo ✅ GitHub CLI 已就绪
echo.

:: 2. 创建 GitHub 仓库
echo 📦 正在创建 GitHub 仓库 %REPO_NAME% ...
%GH% repo create %GITHUB_USER%/%REPO_NAME% --public --source="%REPO_DIR%" --remote=origin --push --description="质检培训看板 - 门锁/灯饰/导轨质检标准和日常管理" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  仓库可能已存在，尝试直接推送...
    cd /d "%REPO_DIR%"
    git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git 2>nul
    git push -u origin main
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 推送失败，请检查仓库 %REPO_NAME% 是否已创建
        pause
        exit /b 1
    )
)
echo ✅ 代码已推送到 GitHub
echo.

:: 3. 启用 GitHub Pages
echo 🌐 正在启用 GitHub Pages (从 main 分支)...
%GH% api repos/%GITHUB_USER%/%REPO_NAME%/pages -X POST -f source.branch=main -f source.path=/ 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  GitHub Pages 可能已启用或需手动设置，正在尝试更新配置...
    %GH% api repos/%GITHUB_USER%/%REPO_NAME%/pages -X PUT -f source.branch=main -f source.path=/ 2>&1
)
echo.
echo ============================================
echo ✅ 部署完成！
echo.
echo 📎 访问地址:
echo   https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo.
echo ⏳ GitHub Pages 首次部署可能需要 1-2 分钟生效
echo ============================================
pause
