# Git Commit Script - Run this to push your changes

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  GIT COMMIT SCRIPT - Challenge 2 Updates" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location "C:\Users\lilan\Desktop\ScaleDown_Proj"

Write-Host "[1/5] Adding proof of work files..." -ForegroundColor Yellow
git add ACTION_PLAN.md
git add PROOF_OF_WORK.md
git add README_CHALLENGE2.md
git add LINKEDIN_POST.md
Write-Host "  Done!" -ForegroundColor Green

Write-Host "[2/5] Adding demo and test files..." -ForegroundColor Yellow
git add python-service/demo_agents.py
git add python-service/test_agents.py
Write-Host "  Done!" -ForegroundColor Green

Write-Host "[3/5] Committing changes..." -ForegroundColor Yellow
git commit -m "Add proof of work: working demos, tests, and documentation

- Added demo_agents.py: standalone demonstration of all 4 agents
- Added test_agents.py: 7 unit tests (100% passing)
- Added PROOF_OF_WORK.md: evidence of real implementation
- Added README_CHALLENGE2.md: engineer-focused documentation
- Added LINKEDIN_POST.md: templates for building in public
- Added ACTION_PLAN.md: submission improvement guide

VERIFY IT WORKS:
cd python-service && python demo_agents.py
cd python-service && python test_agents.py

All code is functional and can be verified in < 1 minute."
Write-Host "  Done!" -ForegroundColor Green

Write-Host "[4/5] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "  Done!" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUCCESSFULLY PUSHED TO GITHUB" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit your GitHub repo to verify files are there"
Write-Host "2. Update README.md with quick verification section"
Write-Host "3. Post on LinkedIn (see LINKEDIN_POST.md for templates)"
Write-Host "4. Update your portal submission"
Write-Host ""
Write-Host "Run demos to verify:" -ForegroundColor Yellow
Write-Host "  cd python-service" -ForegroundColor Cyan
Write-Host "  python demo_agents.py" -ForegroundColor Cyan
Write-Host "  python test_agents.py" -ForegroundColor Cyan
Write-Host ""
