#!/usr/bin/env pwsh
# Generate secure admin token for Phase 2 admin endpoints

Write-Host "Generating secure ADMIN_TOKEN..." -ForegroundColor Cyan

# Generate 32 random bytes
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)

# Convert to base64 and make URL-safe
$token = [Convert]::ToBase64String($bytes).Replace('=','').Replace('+','-').Replace('/','_')

# Save to .env file
$envFile = Join-Path $PSScriptRoot ".." ".env"
$envExample = Join-Path $PSScriptRoot ".." ".env.example"

if (Test-Path $envFile) {
    # Append or update existing .env
    $content = Get-Content $envFile -Raw
    if ($content -match 'ADMIN_TOKEN=') {
        $content = $content -replace 'ADMIN_TOKEN=.*', "ADMIN_TOKEN=$token"
        Set-Content -Path $envFile -Value $content -NoNewline
        Write-Host "Updated ADMIN_TOKEN in .env file" -ForegroundColor Green
    } else {
        Add-Content -Path $envFile -Value "`nADMIN_TOKEN=$token"
        Write-Host "Added ADMIN_TOKEN to .env file" -ForegroundColor Green
    }
} else {
    # Create new .env from template
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        $content = Get-Content $envFile -Raw
        $content = $content -replace 'ADMIN_TOKEN=.*', "ADMIN_TOKEN=$token"
        Set-Content -Path $envFile -Value $content -NoNewline
        Write-Host "Created .env file with ADMIN_TOKEN" -ForegroundColor Green
    } else {
        "ADMIN_TOKEN=$token" | Out-File -Encoding UTF8 -FilePath $envFile
        Write-Host "Created .env file with ADMIN_TOKEN" -ForegroundColor Green
    }
}

Write-Host "`nYour ADMIN_TOKEN:" -ForegroundColor Yellow
Write-Host $token -ForegroundColor White
Write-Host "`nToken has been saved to .env file" -ForegroundColor Green
Write-Host "Use this token in the 'x-admin-token' header for admin endpoints" -ForegroundColor Cyan

# Optional: Generate webhook secret too
Write-Host "`n---" -ForegroundColor Gray
$generateWebhook = Read-Host "Generate WEBHOOK_SECRET too? (Y/n)"
if ($generateWebhook -ne 'n' -and $generateWebhook -ne 'N') {
    $webhookBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($webhookBytes)
    $webhookSecret = [Convert]::ToBase64String($webhookBytes).Replace('=','').Replace('+','-').Replace('/','_')
    
    $content = Get-Content $envFile -Raw
    if ($content -match 'WEBHOOK_SECRET=') {
        $content = $content -replace 'WEBHOOK_SECRET=.*', "WEBHOOK_SECRET=$webhookSecret"
        Set-Content -Path $envFile -Value $content -NoNewline
        Write-Host "Updated WEBHOOK_SECRET in .env file" -ForegroundColor Green
    } else {
        Add-Content -Path $envFile -Value "`nWEBHOOK_SECRET=$webhookSecret"
        Write-Host "Added WEBHOOK_SECRET to .env file" -ForegroundColor Green
    }
    
    Write-Host "`nYour WEBHOOK_SECRET:" -ForegroundColor Yellow
    Write-Host $webhookSecret -ForegroundColor White
}

Write-Host "`nDone! You can now start the services:" -ForegroundColor Cyan
Write-Host "  npm run start-proxy" -ForegroundColor White
Write-Host "  npm run start:webhooks" -ForegroundColor White
Write-Host "  npm run start:sync" -ForegroundColor White
