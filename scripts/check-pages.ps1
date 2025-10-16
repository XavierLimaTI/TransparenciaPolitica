Param(
    [string]$Owner = 'XavierLimaTI',
    [string]$Repo = 'TransparenciaPolitica',
    [string]$File = 'data/despesas.csv.json'
)

$pagesUrl = "https://${Owner}.github.io/${Repo}/${File}"
$rawUrl = "https://raw.githubusercontent.com/${Owner}/${Repo}/gh-pages/${File}"

Write-Output "Checking Pages URL: $pagesUrl"
try {
    $r = Invoke-WebRequest -Uri $pagesUrl -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Output "Pages OK (status $($r.StatusCode)). First 20 lines:"
    $r.Content.Split("`n")[0..19] | ForEach-Object { Write-Output $_ }
    exit 0
} catch {
    Write-Output "Pages not reachable or returned error; falling back to raw URL: $rawUrl"
}

try {
    $r2 = Invoke-WebRequest -Uri $rawUrl -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Output "Raw URL OK (status $($r2.StatusCode)). First 20 lines:"
    $r2.Content.Split("`n")[0..19] | ForEach-Object { Write-Output $_ }
    exit 0
} catch {
    Write-Output "Raw URL also failed: $($_.Exception.Message)"
    exit 2
}
