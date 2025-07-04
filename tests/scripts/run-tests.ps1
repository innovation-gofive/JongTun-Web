# Dev War K6 Test Runner
# Runs both load test and spam test to validate our core problem solutions

Write-Host "🎯 Dev War Reservation System - Performance Test Suite" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if K6 is installed
try {
    $k6Version = k6 version 2>$null
    Write-Host "✅ K6 detected: $k6Version" -ForegroundColor Green
} catch {
    Write-Host "❌ K6 not found. Please install K6 from https://k6.io/" -ForegroundColor Red
    exit 1
}

# Check if Next.js server is running
$baseUrl = "http://localhost:3000"
try {
    Invoke-WebRequest -Uri "$baseUrl/api/queue/status" -Method GET -TimeoutSec 5 2>$null | Out-Null
    Write-Host "✅ Next.js server detected at $baseUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Next.js server not responding at $baseUrl" -ForegroundColor Red
    Write-Host "   Please start your server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Test Suite..." -ForegroundColor Yellow
Write-Host ""

# Run Load Test
Write-Host "📊 Phase 1: Load Test (Normal Usage Pattern)" -ForegroundColor Cyan
Write-Host "   Testing: 500 users, 5-second polling, 1 minute duration" -ForegroundColor Gray
Write-Host "   Purpose: Validate baseline performance and scalability" -ForegroundColor Gray
Write-Host ""

try {
    k6 run k6-load-test.js
    Write-Host "✅ Load Test completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Load Test failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "⏱️  Waiting 5 seconds before spam test..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run Spam Test
Write-Host "🔥 Phase 2: Spam Test (Rate Limiter Validation)" -ForegroundColor Cyan
Write-Host "   Testing: 5 aggressive users, maximum request rate, 10 seconds" -ForegroundColor Gray
Write-Host "   Purpose: Verify Problem #2 (Server Overload) solution" -ForegroundColor Gray
Write-Host "   Expected: High rate of 429 responses (this proves success!)" -ForegroundColor Yellow
Write-Host ""

try {
    k6 run k6-spam-test.js
    Write-Host "✅ Spam Test completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Spam Test failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Test Suite Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Test Summary:" -ForegroundColor Cyan
Write-Host "   ✓ Load Test: Validates system performance under normal load" -ForegroundColor White
Write-Host "   ✓ Spam Test: Validates rate limiter protects against overload" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Key Success Indicators:" -ForegroundColor Yellow
Write-Host "   • Load Test: <10% error rate, <2s response times" -ForegroundColor White
Write-Host "   • Spam Test: >70% rate limiting (429 responses)" -ForegroundColor White
Write-Host ""
Write-Host "🏆 High rate limiting in spam test = Problem #2 SOLVED!" -ForegroundColor Green
Write-Host ""
