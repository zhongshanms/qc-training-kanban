@echo off
chcp 65001 >nul
title 质检培训看板 - 部署到 Gitee Pages

echo ============================================
echo   质检培训看板 - 部署到 Gitee Pages
echo ============================================
echo.
echo 目标仓库: https://gitee.com/zhongshanzhijian/qc-training-kanban
echo Pages:     https://zhongshanzhijian.gitee.io/qc-training-kanban/
echo.

cd /d "%~dp0"

echo [1/3] 检查工作区状态...
git status --short
if %ERRORLEVEL% NEQ 0 (
    echo [!] Git 状态检查失败
    pause
    exit /b 1
)

echo.
echo [2/3] 添加并提交更改...
set /p COMMIT_MSG="请输入更新说明（直接回车使用默认）: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=更新质检看板数据

git add .
git commit -m "%COMMIT_MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo [!] 提交失败或无可提交更改
    pause
    exit /b 1
)

echo.
echo [3/3] 推送到 Gitee...
git push gitee
if %ERRORLEVEL% NEQ 0 (
    echo [!] 推送失败，请检查网络和认证
    pause
    exit /b 1
)

echo.
echo ============================================
echo   部署完成！
echo   Gitee Pages 将在 1-2 分钟内自动更新
echo   访问: https://zhongshanzhijian.gitee.io/qc-training-kanban/
echo ============================================
pause
