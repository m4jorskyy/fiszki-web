param(
    [Parameter(Mandatory=$true)][string]$ServiceName,
    [Parameter(Mandatory=$true)][string]$DeployDir,
    [Parameter(Mandatory=$true)][string]$Port,
    [Parameter(Mandatory=$false)][string]$EnvName = "prod",
    [Parameter(Mandatory=$false)][string]$ApiUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "Stopping service $ServiceName if running..."
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

$logDir   = Join-Path $DeployDir "logs"
$serverJs = Join-Path $DeployDir "server.js"

New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

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

$envLines = @(
    "NODE_ENV=production",
    "HOSTNAME=0.0.0.0",
    "PORT=$Port",
    "ENV_NAME=$EnvName",
    "NEXT_PUBLIC_DEFAULT_ENV=$EnvName",
    "FISZKI_API_URL=$ApiUrl",
    "FISZKI_PROD_API_URL=http://localhost:8080",
    "FISZKI_STAGING_API_URL=http://localhost:8081"
)
Set-Content -Path (Join-Path $DeployDir ".env") -Value $envLines -Encoding Ascii

if (-not (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue)) {
    Write-Host "Service $ServiceName not registered yet. Auto-registering via NSSM..."
    $nodePath = (Get-Command node -ErrorAction Stop).Source
    nssm install $ServiceName $nodePath $serverJs
    nssm set $ServiceName AppDirectory $DeployDir
    nssm set $ServiceName Start SERVICE_AUTO_START
    nssm set $ServiceName AppStdout (Join-Path $logDir "stdout.log")
    nssm set $ServiceName AppStderr (Join-Path $logDir "stderr.log")
    nssm set $ServiceName AppRotateFiles 1
    nssm set $ServiceName AppRotateBytes 10485760
}

if (Get-Command nssm -ErrorAction SilentlyContinue) {
    nssm set $ServiceName AppEnvironmentExtra `
        "NODE_ENV=production" `
        "HOSTNAME=0.0.0.0" `
        "PORT=$Port" `
        "ENV_NAME=$EnvName" `
        "NEXT_PUBLIC_DEFAULT_ENV=$EnvName" `
        "FISZKI_API_URL=$ApiUrl" `
        "FISZKI_PROD_API_URL=http://localhost:8080" `
        "FISZKI_STAGING_API_URL=http://localhost:8081" | Out-Null
}

Write-Host "Starting Windows Service $ServiceName..."
Start-Service -Name $ServiceName

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

Write-Host "$ServiceName ($EnvName -> $ApiUrl) is up and healthy on port $Port!"

# Verify the Web UI -> fiszki-server proxy path (does not fail the deploy, only warns)
try {
    $apiHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/proxy/healthz" -TimeoutSec 5
    if ($apiHealth.status -eq "ok") {
        Write-Host "Proxy check OK: http://127.0.0.1:$Port/api/proxy/healthz -> $ApiUrl (status=ok)"
    } else {
        Write-Warning "Proxy reached fiszki-server at $ApiUrl but status='$($apiHealth.status)'"
    }
} catch {
    Write-Warning "Proxy check FAILED: fiszki-web cannot reach fiszki-server at $ApiUrl ($($_.Exception.Message)). Is the fiszki-server service running?"
}
