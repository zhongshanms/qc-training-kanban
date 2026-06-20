<#
.SYNOPSIS
  一键部署 binboard (质检培训看板) 到 GitHub Pages
.DESCRIPTION
  1. 检查 gh CLI 登录状态
  2. 创建 GitHub 仓库 zhongshanms/binboard (公共)
  3. 推送代码
  4. 启用 GitHub Pages
#>

$ErrorActionPreference = "Stop"
$GH = "C:\Program Files\GitHub CLI\gh.exe"
$REPO_DIR = "C:\Users\cr\ZCodeProject\binboard"
$REPO = "zhongshanms/binboard"
$REPO_NAME = "binboard"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  binboard - GitHub Pages 部署脚本" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] 目标仓库: $REPO" -ForegroundColor Yellow

# Step 1: Check gh CLI auth
Write-Host "[2/4] 检查 GitHub CLI 认证状态..." -ForegroundColor Yellow
$authStatus = & $GH auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] 未登录 GitHub CLI，正在启动登录流程..." -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择登录方式:" -ForegroundColor White
    Write-Host "  1. 浏览器登录（推荐）"
    Write-Host "  2. Token 登录（需提前创建 PAT）"
    Write-Host ""
    & $GH auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] 登录失败，请重试" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
}
Write-Host "[OK] GitHub CLI 已就绪" -ForegroundColor Green

# Step 2: Create GitHub repo and push
Write-Host "[3/4] 创建 GitHub 仓库并推送代码..." -ForegroundColor Yellow
$createResult = & $GH repo create $REPO --public --source="$REPO_DIR" --remote=origin --push --description="质检培训看板 - 门锁/灯饰/导轨质检标准和日常管理" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] 仓库可能已存在，尝试直接推送..." -ForegroundColor Yellow
    Push-Location $REPO_DIR
    git remote add origin "https://github.com/$REPO.git" 2>$null
    git push -u origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] 推送失败，请检查仓库 $REPO_NAME 是否已创建" -ForegroundColor Red
        Pop-Location
        Read-Host "按回车键退出"
        exit 1
    }
    Pop-Location
}
Write-Host "[OK] 代码已推送到 GitHub" -ForegroundColor Green

# Step 3: Enable GitHub Pages
Write-Host "[4/4] 启用 GitHub Pages..." -ForegroundColor Yellow
try {
    $null = & $GH api "repos/$REPO/pages" -X POST -f "source.branch=main" -f "source.path=/" 2>&1
} catch {
    Write-Host "[!] 可能已启用，尝试更新配置..." -ForegroundColor Yellow
    $null = & $GH api "repos/$REPO/pages" -X PUT -f "source.branch=main" -f "source.path=/" 2>&1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "  访问地址:" -ForegroundColor White
Write-Host "  https://zhongshanms.github.io/binboard/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  GitHub Pages 首次部署可能需要 1-2 分钟生效" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Green
Read-Host "按回车键退出"
