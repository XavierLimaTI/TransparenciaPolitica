# Update data by running the scraper and then building the project
# Usage: .\scripts\update-data.ps1 [max]
param(
    [int]$max = 20
)

Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location -LiteralPath '..'

Write-Host "Running scraper to download up to $max datasets..."
node scripts/scrape_and_download_portal_datasets.js $max

Write-Host 'Rebuilding project to include downloaded data...'
npm run build

Write-Host 'Done. Run npm run preview to serve the dist/ folder.'
