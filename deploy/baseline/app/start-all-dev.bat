@echo off
chcp 65001 >nul
echo ========================================
echo Seer Server - 启动所有服务 (开发模式)
echo ========================================
echo.

echo 检查依赖...
if not exist "node_modules" (
    echo [警告] 未检测到 node_modules 目录
    echo 正在运行安装脚本...
    call install.bat
    if errorlevel 1 exit /b 1
)

if not exist "web\node_modules" (
    echo [警告] 未检测到 Web GM 依赖
    echo 正在安装 Web GM 依赖...
    cd web
    call npm install
    cd ..
)

echo.
echo 检查配置文件...
if not exist "config\server.json" (
    echo [错误] 配置文件不存在: config\server.json
    echo 请运行 install.bat 或手动复制 config\server.json.default
    pause
    exit /b 1
)

echo.
echo ========================================
echo 启动服务...
echo ========================================
echo.
echo [提示] 开发模式支持热重载
echo [提示] 按 Ctrl+C 停止服务
echo.

npm run dev
