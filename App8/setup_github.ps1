# GitHub Setup Script
Write-Host "Configuring GitHub Repository..." -ForegroundColor Cyan

# Check if git is initialized
if (-not (Test-Path .git)) {
    git init
    Write-Host "Initialized Git repository."
}

# Add all files
git add .
git commit -m "Initial commmit: Server Dashboard v1.0 (Premium UI)"

# Instructions
Write-Host "`n✅ Repository Ready!" -ForegroundColor Green
Write-Host "To push to GitHub, run these commands manually:" -ForegroundColor Yellow
Write-Host "1. Create a new repository on GitHub.com"
Write-Host "2. Run: git remote add origin <YOUR_GITHUB_URL>"
Write-Host "3. Run: git push -u origin master"
Read-Host -Prompt "Press Enter to exit"
