# Apply RLS Migration to Supabase

Write-Host "`n🔐 Applying Row Level Security Migration`n" -ForegroundColor Cyan

# Read the SQL file
$sqlFile = "c:\Users\lilan\Desktop\ScaleDown_Proj\supabase\migrations\003_enable_rls.sql"
$sql = Get-Content $sqlFile -Raw

Write-Host "Running RLS migration..." -ForegroundColor Yellow
Write-Host "(This enables RLS but allows service_role full access)`n" -ForegroundColor Gray

# You'll need to run this via Supabase Dashboard SQL Editor or CLI
Write-Host "📋 Copy the SQL and run in Supabase Dashboard → SQL Editor:`n" -ForegroundColor Cyan
Write-Host "File: $sqlFile`n" -ForegroundColor White

# Or use Supabase CLI if available
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Write-Host "✅ Supabase CLI detected. Running migration..." -ForegroundColor Green
    supabase db push
} else {
    Write-Host "⚠️  Supabase CLI not found." -ForegroundColor Yellow
    Write-Host "Option 1: Install CLI: npm install -g supabase" -ForegroundColor White
    Write-Host "Option 2: Copy SQL manually to Supabase Dashboard`n" -ForegroundColor White
    
    # Open the SQL file
    Write-Host "Opening SQL file..." -ForegroundColor Cyan
    notepad $sqlFile
}
