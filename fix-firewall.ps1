# Run this script as Administrator to allow Laravel server on port 8000
# Right-click PowerShell and select "Run as Administrator", then run: .\fix-firewall.ps1

netsh advfirewall firewall add rule name="Laravel Dev Server" dir=in action=allow protocol=TCP localport=8000

Write-Host "Firewall rule added successfully!" -ForegroundColor Green
Write-Host "You can now access the server from other devices on your network." -ForegroundColor Green

