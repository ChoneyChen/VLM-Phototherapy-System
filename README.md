# VLM Phototherapy System

生产级多用户面部皮肤识别与光疗方案系统。

## 启动方式

### 一键启动

双击根目录下的 `start-dev.bat`，或在 PowerShell 中运行：

```powershell
.\start-dev.ps1
```

脚本会自动：

- 检查并创建 `.venv`
- 安装后端依赖
- 在缺少 `node_modules` 时安装前端依赖
- 分别打开前后端开发窗口

### 后端

```powershell
.venv\Scripts\Activate.ps1
cd backend
python -m app.main
```

### 前端

```powershell
cd frontend
npm install
npm run dev
```

### CLI

```powershell
.venv\Scripts\Activate.ps1
cd backend
python -m app.cli users list
python -m app.cli users create --name "Alice"
python -m app.cli assess --user USR-0001 --image "C:\path\face.jpg" --provider gemini
```
