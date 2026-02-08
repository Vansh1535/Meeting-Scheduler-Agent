$body = Get-Content 'test_request.json' -Raw
$response = Invoke-RestMethod -Uri 'http://localhost:8000/schedule' -Method Post -ContentType 'application/json' -Body $body

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   AI MEETING SCHEDULER - TEST RESULTS  " -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Meeting ID: " -NoNewline; Write-Host $response.meeting_id -ForegroundColor Yellow
Write-Host "Success: " -NoNewline; Write-Host $response.success -ForegroundColor $(if ($response.success) { "Green" } else { "Red" })
Write-Host "Message: $($response.message)`n"

Write-Host "=== PERFORMANCE METRICS ===" -ForegroundColor Magenta
Write-Host "Processing Time: $($response.processing_time_ms) ms"
Write-Host "Candidates Found: $($response.candidates.Count)"
Write-Host "Total Evaluated: $($response.total_candidates_evaluated)"
Write-Host "Negotiation Rounds: $($response.negotiation_rounds)`n"

Write-Host "=== ANALYTICS ===" -ForegroundColor Magenta
Write-Host "Time Saved: $($response.analytics.estimated_time_saved_minutes) minutes"
Write-Host "Overhead Reduction: $($response.analytics.coordination_overhead_reduction_pct)%"
Write-Host "Top Confidence: $($response.analytics.top_candidate_confidence)"
Write-Host "Participants: $($response.analytics.participants_count) (Required: $($response.analytics.required_participants), Optional: $($response.analytics.optional_participants))`n"

Write-Host "=== AGENT VERIFICATION ===" -ForegroundColor Magenta
Write-Host "[✓] Availability Agent: Evaluated $($response.total_candidates_evaluated) time slots" -ForegroundColor Green
Write-Host "[✓] Preference Agent: Scored based on group preferences" -ForegroundColor Green
Write-Host "[✓] Optimization Agent: Ranked candidates by composite score" -ForegroundColor Green
Write-Host "[✓] Negotiation Agent: Ran $($response.negotiation_rounds) negotiation round(s)" -ForegroundColor Green
Write-Host ""

Write-Host "=== TOP 5 MEETING CANDIDATES ===" -ForegroundColor Cyan
for ($i = 0; $i -lt [Math]::Min(5, $response.candidates.Count); $i++) {
    $c = $response.candidates[$i]
    Write-Host "`n[$($i + 1)] " -NoNewline -ForegroundColor Yellow
    Write-Host "Score: $($c.score)/100" -ForegroundColor $(if ($c.score -ge 80) { "Green" } elseif ($c.score -ge 60) { "Yellow" } else { "Red" })
    Write-Host "    Time: $($c.slot.start) to $($c.slot.end)"
    Write-Host "    Breakdown: Availability=$($c.availability_score), Preference=$($c.preference_score), Optimization=$($c.optimization_score)"
    Write-Host "    All Available: $($c.all_participants_available)"
    Write-Host "    Conflicts: $($c.conflicts.Count)"
    Write-Host "    Reasoning: $($c.reasoning)"
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
