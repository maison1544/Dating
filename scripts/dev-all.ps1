$env:NEXT_PUBLIC_APP_INSTANCE = "user"
$env:NEXT_DEV_DIST_DIR = ".next-user"
Start-Process -NoNewWindow powershell -ArgumentList "-Command", "cd apps/web; npx next dev -p 3000"

$env:NEXT_PUBLIC_APP_INSTANCE = "admin"
$env:NEXT_DEV_DIST_DIR = ".next-admin"
Start-Process -NoNewWindow powershell -ArgumentList "-Command", "cd apps/web; npx next dev -p 3001"

$env:NEXT_PUBLIC_APP_INSTANCE = "agent"
$env:NEXT_DEV_DIST_DIR = ".next-agent"
Start-Process -NoNewWindow powershell -ArgumentList "-Command", "cd apps/web; npx next dev -p 3002"

Write-Host "All dev servers started: user=3000, admin=3001, agent=3002"
