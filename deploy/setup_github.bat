@echo off
chcp 65001 >nul
echo ================================================
echo 手搓应用 - GitHub仓库设置脚本
echo ================================================
echo.

echo [1/4] 检查Git安装...
git --version
if errorlevel 1 (
    echo ❌ Git未安装！请先安装Git: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git已安装
echo.

echo [2/4] 创建GitHub仓库...
echo 请在浏览器中执行以下操作：
echo 1. 访问 https://github.com/new
echo 2. 仓库名输入: handmade-ai-tools
echo 3. 选择 Public（公开）
echo 4. 不要勾选 "Initialize this repository with a README"
echo 5. 点击 "Create repository"
echo.
echo 创建完成后，按任意键继续...
pause >nul

echo.
echo [3/4] 连接GitHub仓库...
echo 请手动执行以下命令（复制粘贴到Git Bash中）:
echo.
echo cd /d/WB工作学习记录文档/海外生意怎么做/手搓应用
echo git remote add origin https://github.com/你的用户名/handmade-ai-tools.git
echo git branch -M main
echo.
echo 执行完成后，按任意键继续...
pause >nul

echo.
echo [4/4] 首次推送代码...
echo 执行命令:
echo git add .
echo git commit -m "初始提交：288个AI工具"
echo git push -u origin main
echo.
echo ================================================
echo 设置完成！
echo ================================================
pause
