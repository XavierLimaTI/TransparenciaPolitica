# Start proxy and preview server (PowerShell)
# Usage: .\scripts\start-all.ps1

Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location -LiteralPath '..'

Write-Host 'Starting proxy (server/proxy.js) on port 3001...'
Start-Process -NoNewWindow -FilePath 'node' -ArgumentList 'server/proxy.js'

Start-Sleep -Seconds 1

Write-Host 'Starting preview server (dist) on port 8000...'
Start-Process -NoNewWindow -FilePath 'npx' -ArgumentList 'http-server ./dist -p 8000'

Write-Host 'Started proxy and preview server.'
