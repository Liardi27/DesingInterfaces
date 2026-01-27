# Public Access Script using LocalTunnel
Write-Host "Setting up Public Access..." -ForegroundColor Cyan

# Install localtunnel if missing
if (-not (Get-Command lt -ErrorAction SilentlyContinue)) {
    Write-Host "Installing localtunnel..."
    npm install -g localtunnel
}

# Ask specifically for port 5174 since that's where Vite is running now
Write-Host "Exposing Port 5174..."
Write-Host "NOTE: You might need to enter the password 'endpoint' if asked website." -ForegroundColor Gray

# Run
lt --port 5174
