# Auto-Configure VirtualBox Network
# This script automates setting up Bridged Networking for your VMs
$VBOX_PATH = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"

if (-not (Test-Path $VBOX_PATH)) {
    Write-Error "VirtualBox not found at standard path."
    exit
}

Write-Host "🔍 Scanning Virtual Machines..." -ForegroundColor Cyan
$vmsRaw = & $VBOX_PATH list vms
$vms = $vmsRaw | ForEach-Object {
    if ($_ -match '"([^"]+)" \{([^\}]+)\}') {
        [PSCustomObject]@{
            Name = $matches[1]
            UUID = $matches[2]
        }
    }
}

Write-Host "`n📋 Available VMs:" -ForegroundColor White
for ($i = 0; $i -lt $vms.Count; $i++) {
    Write-Host "[$i] $($vms[$i].Name)" -ForegroundColor Yellow
}

$selection = Read-Host "`n👉 Enter the NUMBER of the VM to configure (e.g. 0)"
if ($selection -lt 0 -or $selection -ge $vms.Count) {
    Write-Error "Invalid selection."
    exit
}
$selectedVM = $vms[$selection]

Write-Host "`n🔍 Scanning Network Adapters on Host..." -ForegroundColor Cyan
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' }
for ($i = 0; $i -lt $adapters.Count; $i++) {
    Write-Host "[$i] $($adapters[$i].Name) - $($adapters[$i].InterfaceDescription)" -ForegroundColor Green
}

$netSelection = Read-Host "`n👉 Enter the NUMBER of your active internet adapter (e.g. Wi-Fi)"
if ($netSelection -lt 0 -or $netSelection -ge $adapters.Count) {
    Write-Error "Invalid selection."
    exit
}
$selectedAdapter = $adapters[$netSelection]

Write-Host "`n⚙️ CONFIGURING..." -ForegroundColor Magenta
Write-Host "Target VM: $($selectedVM.Name)"
Write-Host "Target Adapter: $($selectedAdapter.InterfaceDescription)"

# Suggest powering off
Write-Host "`n⚠️  NOTE: The VM must be Powered Off to change network settings."
$choice = Read-Host "Do you want me to force Power Off this VM now? (y/n)"
if ($choice -eq 'y') {
    & $VBOX_PATH controlvm $selectedVM.UUID poweroff
    Start-Sleep -Seconds 2
}

# Configure Bridged Mode
Write-Host "Setting NIC 1 to Bridged Mode..."
& $VBOX_PATH modifyvm $selectedVM.UUID --nic1 bridged --bridgeadapter1 $selectedAdapter.InterfaceDescription

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Network configured." -ForegroundColor Green
    Write-Host "Now start your VM, login, and run 'ip a' to get your new IP address."
    Write-Host "Then put that IP into the Dashboard."
}
else {
    Write-Error "Failed to configure VM."
}
Pause
