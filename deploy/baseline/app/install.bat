@echo off
chcp 65001 >nul
echo ========================================
echo Seer Server - 快速安装
echo ========================================
echo.

echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
node --version

echo.
echo [2/4] 安装服务器依赖...
call npm install

if errorlevel 1 (
    echo.
    echo [错误] 服务器依赖安装失败
    pause
    exit /b 1
)

echo.
echo [3/4] 安装 Web GM 依赖...
cd web
call npm install
cd ..

if errorlevel 1 (
    echo.
    echo [错误] Web GM 依赖安装失败
    pause
    exit /b 1
)

echo.
echo [4/4] 初始化配置...
if not exist "config\server.json" (
    echo 复制默认配置文件...
    copy "config\server.json.default" "config\server.json" >nul
    echo 配置文件已创建: config\server.json
) else (
    echo 配置文件已存在，跳过
)

if not exist "data" (
    echo 创建数据目录...
    mkdir data
)

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 使用方法:
echo   - 开发模式: npm run dev (推荐)
echo   - 或使用: start-all-dev.bat
echo   - 生产模式: npm start
echo.
echo 配置文件: config\server.json
echo 数据库文件: data\seer.db
echo.
echo 访问地址:
echo   - 游戏服务器: http://localhost:9339
echo   - GM 管理面板: http://localhost:5173
echo.
pause
