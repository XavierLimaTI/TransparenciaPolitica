<#
ci-local.ps1
Automatiza uma reprodução local simplificada do CI:
- Instala dependências (opcional)
- Inicia servidor estático (http-server)
- Inicia proxy (start-proxy)
- Inicia webhooks (server/webhooks.js)
- Roda start:sync
- Executa Playwright tests

Uso: execute em PowerShell na raiz do repositório:

.
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
.
# .\scripts\ci-local.ps1 -InstallDeps -RunTests
#
# Flags:
# -InstallDeps : roda npm install antes de iniciar os serviços
# -RunTests    : roda Playwright ao final (com variáveis BASE_URL/PROXY_BASE/WEBHOOKS_BASE)
#
# Observação: este script é uma conveniência para dev. Não substitui o CI.
#
# Autor: automatizado (gerado por assistente)
#>
param(
    [switch]$InstallDeps,
    [switch]$RunTests,
    [switch]$AutoTeardown,
    [switch]$LogSummary,
    [switch]$DryRun
)

# Path for logs and pids
$logsDir = Join-Path -Path (Get-Location) -ChildPath '.logs'
if (-not (Test-Path $logsDir)) { New-Item -Path $logsDir -ItemType Directory | Out-Null }

# File to store PIDs of started processes
$pidsFile = Join-Path $logsDir 'ci-local.pids'

# Record global start time for summary
$script:ciLocalStart = Get-Date


function Wait-ForHttp {
    param(
        [string]$Url,
        [int]$Retries = 30,
        [int]$DelaySeconds = 1
    )
    for ($i=1; $i -le $Retries; $i++) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2 -ErrorAction Stop
            Write-Host "[OK] $Url returned $($r.StatusCode)"
            return $true
        } catch {
            Write-Host "Waiting for $Url ($i/$Retries)"
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    return $false
}

# Move para raiz do repositório (assume que o script fica em ./scripts)
try {
    $scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
    $repoRoot = Resolve-Path -Path (Join-Path $scriptDir '..')
    Set-Location -LiteralPath $repoRoot.Path
} catch {
    Write-Warning 'Não foi possível alterar para a raiz do repositório; usando diretório atual.'
}

$isWin = ($env:OS -eq 'Windows_NT')
if ($InstallDeps) {
    Write-Host 'Installing npm dependencies...'
    if ($isWin) {
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npm install --no-audit --no-fund' -NoNewWindow -Wait
    } else {
        Start-Process -FilePath 'npm' -ArgumentList 'install','--no-audit','--no-fund' -NoNewWindow -Wait
    }
}

# Prepare logs directory
$logsDir = Join-Path -Path (Get-Location) -ChildPath '.logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
$pidsFile = Join-Path $logsDir 'pids.txt'
$summaryFile = Join-Path $logsDir 'ci-local.log'

# Helper to start a process and capture PID + redirect output
function Start-LoggedProcess($name, $cmdLine) {
    $out = Join-Path $logsDir "${name}.out.log"
    $err = Join-Path $logsDir "${name}.err.log"
    Write-Host "Starting $name (logs: $out , $err)"
    if ($DryRun) {
        # In dry-run mode we don't actually start processes. Record a DRYRUN entry so logs show intent.
        $entry = "{0} | DRYRUN | {1}" -f (Get-Date -Format o), $cmdLine
        Add-Content -Path $pidsFile -Value $entry
        if ($LogSummary) { Add-Content -Path $summaryFile -Value "DRYRUN START: $entry" }
        # create placeholder log files
        New-Item -Path $out -ItemType File -Force | Out-Null
        New-Item -Path $err -ItemType File -Force | Out-Null
        return @{ Id = 0; Name = $name; DryRun = $true }
    }
    if ($isWin) {
        $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c',$cmdLine -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
    } else {
        $parts = $cmdLine -split ' '
        $proc = Start-Process -FilePath $parts[0] -ArgumentList $parts[1..($parts.Length-1)] -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
    }
    # record pid + meta
    $entry = "{0} | {1} | PID:{2}" -f (Get-Date -Format o), $cmdLine, $proc.Id
    Add-Content -Path $pidsFile -Value $proc.Id
    if ($LogSummary) { Add-Content -Path $summaryFile -Value $entry }
    return $proc
}

# Start static server
Write-Host 'Starting static server (http://127.0.0.1:8000)'
Start-LoggedProcess 'http-server' 'npm run dev:npm'
Start-Sleep -Seconds 2

# Start proxy
Write-Host 'Starting proxy (http://127.0.0.1:3001)'
Start-LoggedProcess 'proxy' 'npm run start-proxy'
Start-Sleep -Seconds 2

# Start webhooks
Write-Host 'Starting webhooks receiver (http://127.0.0.1:3002)'
Start-LoggedProcess 'webhooks' 'npm run start:webhooks'
Start-Sleep -Seconds 2

# Optional: run sync
Write-Host 'Running start:sync to populate server/db.json (optional)'
Start-LoggedProcess 'sync' 'npm run start:sync'
Start-Sleep -Seconds 2

# Wait for health endpoints
if (-not $DryRun) {
    if (-not (Wait-ForHttp -Url 'http://127.0.0.1:3001/health' -Retries 30 -DelaySeconds 1)) {
        Write-Warning 'Proxy did not respond in time; check .proxy.log or start proxy manually.'
    }
    if (-not (Wait-ForHttp -Url 'http://127.0.0.1:3002/health' -Retries 30 -DelaySeconds 1)) {
        Write-Warning 'Webhooks did not respond in time; check .webhooks.log or start webhooks manually.'
    }
} else {
    Write-Host 'DryRun enabled — skipping health checks.'
}

if ($RunTests) {
    Write-Host 'Running Playwright tests (this may install browsers on first run)'
    $env:BASE_URL = 'http://127.0.0.1:8000'
    $env:PROXY_BASE = 'http://127.0.0.1:3001'
    $env:WEBHOOKS_BASE = 'http://127.0.0.1:3002'
    npx playwright install --with-deps
    npx playwright test tests/e2e --reporter=list
}

Write-Host 'Done. Check logs and Playwright reports in .github/artifacts if generated.'

# Final summary (timestamps, duration, pids and logs)
if ($LogSummary) {
    $end = Get-Date
    Add-Content -Path $summaryFile -Value ("Run started: {0}" -f $script:ciLocalStart)
    Add-Content -Path $summaryFile -Value ("Run ended:   {0}" -f $end)
    $dur = New-TimeSpan -Start $script:ciLocalStart -End $end
    Add-Content -Path $summaryFile -Value ("Duration: {0}" -f $dur.ToString())
    Add-Content -Path $summaryFile -Value ("`nPIDs / entries from $($pidsFile):") 
    if (Test-Path $pidsFile) { Get-Content $pidsFile | ForEach-Object { Add-Content -Path $summaryFile -Value $_ } }
    Add-Content -Path $summaryFile -Value ("`nLog files in $($logsDir):") 
    Get-ChildItem -Path $logsDir -File | ForEach-Object { Add-Content -Path $summaryFile -Value $_.Name }
    Add-Content -Path $summaryFile -Value "--- End of summary ---\n"
}

# Teardown helper to stop processes started by this script
function Stop-CILocal {
    if (-not (Test-Path $pidsFile)) { Write-Host 'No pids file found.'; return }
    $lines = Get-Content $pidsFile
    foreach ($line in $lines) {
        if ($line -match 'PID:(\d+)') {
            $procPid = [int]$matches[1]
            try {
                Stop-Process -Id $procPid -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped PID $procPid"
                if ($LogSummary) { Add-Content -Path $summaryFile -Value "Stopped PID $procPid at $(Get-Date -Format o)" }
            } catch {
                Write-Warning "Failed to stop PID $procPid"
                if ($LogSummary) { Add-Content -Path $summaryFile -Value "Failed to stop PID $procPid at $(Get-Date -Format o)" }
            }
        } else {
            # non-numeric entry (DRYRUN or note)
            Write-Host "Skipping non-PID entry: $line"
            if ($LogSummary) { Add-Content -Path $summaryFile -Value "Skipped entry: $line at $(Get-Date -Format o)" }
        }
    }
    Remove-Item -Path $pidsFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Logs available under: $logsDir" 

# Auto teardown on exit if requested
if ($AutoTeardown) {
    Write-Host 'Auto-teardown enabled; will stop started processes on exit.'
    Register-EngineEvent PowerShell.Exiting -Action { Stop-CILocal; if ($LogSummary) { Add-Content -Path $summaryFile -Value "Auto-teardown executed at: $(Get-Date -Format o)" } } | Out-Null
}

# Record global start time for summary
$script:ciLocalStart = Get-Date
