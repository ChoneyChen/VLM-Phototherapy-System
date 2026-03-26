param()

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$frontendNodeModules = Join-Path $projectRoot "frontend\node_modules"
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

function Write-Step([string]$message) {
    Write-Host "[VLM] $message" -ForegroundColor DarkCyan
}

function Ensure-Venv {
    if (Test-Path $venvPython) {
        Write-Step "Python 3.12 virtual environment already exists."
        return
    }

    Write-Step "Creating Python 3.12 virtual environment..."
    py -3.12 -m venv (Join-Path $projectRoot ".venv")
}

function Ensure-BackendDependencies {
    Write-Step "Checking backend dependencies..."
    Push-Location $backendDir
    try {
        & $venvPython -m pip install -e ".[dev]" | Out-Host
    }
    finally {
        Pop-Location
    }
}

function Ensure-FrontendDependencies {
    if (Test-Path $frontendNodeModules) {
        Write-Step "Frontend dependencies already exist."
        return
    }

    Write-Step "Installing frontend dependencies..."
    Push-Location $frontendDir
    try {
        npm install | Out-Host
    }
    finally {
        Pop-Location
    }
}

function Start-BackendWindow {
    $backendCommand = @"
Set-Location '$backendDir'
Write-Host '[Backend] starting FastAPI server...' -ForegroundColor Green
& '$venvPython' -m app.main
"@

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        $backendCommand
    ) | Out-Null
}

function Start-FrontendWindow {
    $frontendCommand = @"
Set-Location '$frontendDir'
Write-Host '[Frontend] starting Vite dev server...' -ForegroundColor Yellow
npm run dev
"@

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        $frontendCommand
    ) | Out-Null
}

Set-Location $projectRoot

Write-Step "Preparing development startup..."
Ensure-Venv
Ensure-BackendDependencies
Ensure-FrontendDependencies

Write-Step "Launching backend and frontend windows..."
Start-BackendWindow
Start-FrontendWindow

Write-Step "Startup triggered. Backend: http://127.0.0.1:8000 Frontend: http://127.0.0.1:5173"
