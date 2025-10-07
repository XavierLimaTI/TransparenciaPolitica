# Generate a secure ADMIN_TOKEN and save it to .env file
param()

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = [System.Convert]::ToBase64String($bytes)

# URL-safe cleanup
$token = $token.Replace('=','').Replace('+','-').Replace('/','_')

$envFile = Join-Path -Path (Get-Location) -ChildPath '.env'

# Create or update .env file
if (Test-Path $envFile) {
    # Update existing .env
    $content = Get-Content $envFile -Raw
    if ($content -match 'ADMIN_TOKEN=.*') {
        $content = $content -replace 'ADMIN_TOKEN=.*', "ADMIN_TOKEN=$token"
    } else {
        $content += "`nADMIN_TOKEN=$token`n"
    }
    $content | Out-File -Encoding UTF8 -FilePath $envFile -NoNewline
} else {
    # Create new .env
    "ADMIN_TOKEN=$token" | Out-File -Encoding UTF8 -FilePath $envFile
}

Write-Host "ADMIN_TOKEN generated and saved to .env"
Write-Host "Token (copy if needed): $token"
