# Run this script ONCE as Administrator in PowerShell on your Windows laptop.
# Prerequisite: Node.js installed + NSSM (`winget install NSSM.NSSM` or `choco install nssm`)

$ErrorActionPreference = "Stop"

$nodePath = (Get-Command node -ErrorAction Stop).Source

$environments = @(
    @{
        Name       = "fiszki-web-prod"
        Dir        = "C:\fiszki-web\prod"
        Port       = "3000"
        DefaultEnv = "prod"
        Desc       = "Fiszki Web UI Production (main branch, port 3000 -> API :8080)"
    },
    @{
        Name       = "fiszki-web-staging"
        Dir        = "C:\fiszki-web\staging"
        Port       = "3001"
        DefaultEnv = "staging"
        Desc       = "Fiszki Web UI Staging (dev branch, port 3001 -> API :8081)"
    }
)

foreach ($env in $environments) {
    $svcName    = $env.Name
    $dir        = $env.Dir
    $serverJs   = Join-Path $dir "server.js"
    $logDir     = Join-Path $dir "logs"

    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null

    if (-not (Get-Service -Name $svcName -ErrorAction SilentlyContinue)) {
        Write-Host "Registering Windows Service: $svcName ..."
        nssm install $svcName $nodePath $serverJs
        nssm set $svcName AppDirectory $dir
        nssm set $svcName Description $env.Desc
        nssm set $svcName Start SERVICE_AUTO_START
        nssm set $svcName AppEnvironmentExtra `
            "NODE_ENV=production" `
            "HOSTNAME=0.0.0.0" `
            "PORT=$($env.Port)" `
            "NEXT_PUBLIC_DEFAULT_ENV=$($env.DefaultEnv)" `
            "FISZKI_PROD_API_URL=http://localhost:8080" `
            "FISZKI_STAGING_API_URL=http://localhost:8081"
        nssm set $svcName AppStdout (Join-Path $logDir "stdout.log")
        nssm set $svcName AppStderr (Join-Path $logDir "stderr.log")
        nssm set $svcName AppRotateFiles 1
        nssm set $svcName AppRotateBytes 10485760
        Write-Host "Registered $svcName on port $($env.Port)."
    } else {
        Write-Host "Service $svcName already exists."
    }
}

Write-Host "`nDone! Both fiszki-web services are registered to start automatically on Windows boot."
