param(
    [Parameter(Mandatory=$true)][string]$ServiceName,
    [Parameter(Mandatory=$true)][string]$DeployDir,
    [Parameter(Mandatory=$true)][string]$Port
)

$ErrorActionPreference = "Stop"

Write-Host "Stopping service $ServiceName if running..."
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null

Write-Host "Copying Next.js standalone build to $DeployDir ..."
Copy-Item -Path ".\.next\standalone\*" -Destination $DeployDir -Recurse -Force

$staticDest = Join-Path $DeployDir ".next\static"
New-Item -ItemType Directory -Force -Path $staticDest | Out-Null
Copy-Item -Path ".\.next\static\*" -Destination $staticDest -Recurse -Force

if (Test-Path ".\public") {
    $publicDest = Join-Path $DeployDir "public"
    New-Item -ItemType Directory -Force -Path $publicDest | Out-Null
    Copy-Item -Path ".\public\*" -Destination $publicDest -Recurse -Force
}

if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Starting Windows Service $ServiceName..."
    Start-Service -Name $ServiceName
} else {
    Write-Warning "Windows Service '$ServiceName' is not registered yet. Run .\deploy\windows\setup-laptop.ps1 as Administrator once on the laptop."
    exit 1
}

Write-Host "Waiting for health check on http://localhost:$Port ..."
$healthy = $false
for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Write-Host "Attempt $i/15: waiting for Next.js server..."
    }
}

if (-not $healthy) {
    Write-Host "=== Service status ==="
    Get-Service -Name $ServiceName | Format-List *
    $stderrLog = Join-Path $DeployDir "logs\stderr.log"
    $stdoutLog = Join-Path $DeployDir "logs\stdout.log"
    if (Test-Path $stderrLog) {
        Write-Host "=== Last 30 lines of stderr.log ==="
        Get-Content $stderrLog -Tail 30
    }
    if (Test-Path $stdoutLog) {
        Write-Host "=== Last 30 lines of stdout.log ==="
        Get-Content $stdoutLog -Tail 30
    }
    Write-Error "Health check failed on port $Port!"
    exit 1
}

Write-Host "$ServiceName is up and healthy on port $Port!"
