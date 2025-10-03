# Stop Node processes and http-server spawned by npx
# Usage: .\scripts\stop-all.ps1

# Stop processes named node.exe and npx (be cautious)
$nodes = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId,CommandLine
foreach ($n in $nodes) {
    Write-Host "Stopping node process $($n.ProcessId) $($n.CommandLine)"
    try { Stop-Process -Id $n.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
}

$np = Get-CimInstance Win32_Process -Filter "Name='npx.exe'" | Select-Object ProcessId,CommandLine
foreach ($p in $np) {
    Write-Host "Stopping npx process $($p.ProcessId) $($p.CommandLine)"
    try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
}

Write-Host 'Stopped Node and npx processes (where found).'
