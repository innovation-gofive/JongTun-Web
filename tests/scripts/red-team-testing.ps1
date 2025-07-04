# 🔴 Red Team Attack Testing Script
# PowerShell script for executing comprehensive security tests

Write-Host "🔴 RED TEAM ATTACK TESTING SUITE" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Configuration
$BASE_URL = "http://localhost:3000"
$K6_EXECUTABLE = "k6"
$BROWSER_EXECUTABLE = "msedge" # or "chrome"

# Update paths for new structure
$K6_SCRIPTS_PATH = "..\k6"
$RED_TEAM_SCRIPTS_PATH = "..\red-team"

# Test if required tools are available
function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if k6 is installed
    try {
        $k6Version = & $K6_EXECUTABLE version 2>$null
        Write-Host "✅ k6 is available: $($k6Version[0])" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ k6 not found. Please install k6: https://k6.io/docs/getting-started/installation/" -ForegroundColor Red
        return $false
    }
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version 2>$null
        Write-Host "✅ Node.js is available: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
        return $false
    }
    
    # Check if the application is running
    try {
        $response = Invoke-RestMethod -Uri $BASE_URL -Method GET -TimeoutSec 5
        Write-Host "✅ Application is running at $BASE_URL" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Application not accessible at $BASE_URL" -ForegroundColor Red
        Write-Host "   Please start the application with: npm run dev" -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

# Function to run k6 load tests
function Start-LoadTesting {
    param(
        [string]$TestType = "all"
    )
    
    Write-Host "🚀 Starting K6 Load Testing..." -ForegroundColor Cyan
    Write-Host "Test Type: $TestType" -ForegroundColor White
    
    $k6ScriptPath = "$K6_SCRIPTS_PATH\k6-red-team-attacks.js"
    
    if (-not (Test-Path $k6ScriptPath)) {
        Write-Host "❌ K6 script not found: $k6ScriptPath" -ForegroundColor Red
        return
    }
    
    switch ($TestType) {
        "load" {
            Write-Host "🎯 Running Load Attack Test..." -ForegroundColor Yellow
            & $K6_EXECUTABLE run --scenario load_attack --env BASE_URL=$BASE_URL $k6ScriptPath
        }
        "spam" {
            Write-Host "🎯 Running API Spam Test..." -ForegroundColor Yellow
            & $K6_EXECUTABLE run --scenario api_spam --env BASE_URL=$BASE_URL $k6ScriptPath
        }
        "bypass" {
            Write-Host "🎯 Running Queue Bypass Test..." -ForegroundColor Yellow
            & $K6_EXECUTABLE run --scenario queue_bypass --env BASE_URL=$BASE_URL $k6ScriptPath
        }
        "ratelimit" {
            Write-Host "🎯 Running Rate Limit Test..." -ForegroundColor Yellow
            & $K6_EXECUTABLE run --scenario rate_limit_test --env BASE_URL=$BASE_URL $k6ScriptPath
        }
        "all" {
            Write-Host "🎯 Running All Attack Scenarios..." -ForegroundColor Yellow
            & $K6_EXECUTABLE run --env BASE_URL=$BASE_URL $k6ScriptPath
        }
        default {
            Write-Host "❌ Unknown test type: $TestType" -ForegroundColor Red
            Write-Host "Available types: load, spam, bypass, ratelimit, all" -ForegroundColor Yellow
        }
    }
}

# Function to run browser-based attacks
function Start-BrowserAttacks {
    Write-Host "🌐 Starting Browser-Based Attacks..." -ForegroundColor Cyan
    
    $scriptPath = "$RED_TEAM_SCRIPTS_PATH\browser-attacks.js"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "❌ Browser attack script not found: $scriptPath" -ForegroundColor Red
        return
    }
    
    # Create a temporary HTML file to load the attack scripts
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Red Team Attack Console</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #1a1a1a; 
            color: #00ff00; 
            padding: 20px; 
        }
        .header { 
            color: #ff4444; 
            font-size: 24px; 
            margin-bottom: 20px; 
        }
        .console { 
            background: #000; 
            padding: 20px; 
            border-radius: 5px; 
            max-height: 400px; 
            overflow-y: auto; 
        }
        button { 
            background: #ff4444; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer; 
            border-radius: 3px; 
        }
        button:hover { background: #ff6666; }
    </style>
</head>
<body>
    <div class="header">🔴 RED TEAM ATTACK CONSOLE</div>
    <div>
        <button onclick="RedTeamAttacker.runAllAttacks()">🚀 Run All Attacks</button>
        <button onclick="RedTeamAttacker.runSingleAttack('load')">📈 Load Test</button>
        <button onclick="RedTeamAttacker.runSingleAttack('spam')">🌊 API Spam</button>
        <button onclick="RedTeamAttacker.runSingleAttack('bypass')">🚪 Queue Bypass</button>
        <button onclick="RedTeamAttacker.runSingleAttack('form')">📝 Form Manipulation</button>
        <button onclick="window.open('$BASE_URL', '_blank')">🎯 Open Target</button>
    </div>
    <div class="console" id="console">
        <p>🔴 Red Team Attack Console Ready</p>
        <p>📋 Instructions:</p>
        <p>1. Open the target application in another tab</p>
        <p>2. Click buttons above to launch attacks</p>
        <p>3. Monitor console for attack results</p>
        <p>4. Check target application for security responses</p>
    </div>
    
    <script src="file:///$((Get-Location).Path)\$RED_TEAM_SCRIPTS_PATH\browser-attacks.js"></script>
    <script>
        // Redirect console output to our console div
        const originalLog = console.log;
        const consoleDiv = document.getElementById('console');
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            const p = document.createElement('p');
            p.textContent = args.join(' ');
            consoleDiv.appendChild(p);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        };
        
        // Auto-open target application
        setTimeout(() => {
            window.open('$BASE_URL', '_blank');
        }, 1000);
    </script>
</body>
</html>
"@
    
    $tempHtmlFile = "red-team-console.html"
    $htmlContent | Out-File -FilePath $tempHtmlFile -Encoding UTF8
    
    try {
        Write-Host "🚀 Opening Red Team Attack Console..." -ForegroundColor Yellow
        Start-Process $tempHtmlFile
        
        Write-Host "✅ Browser attack console launched" -ForegroundColor Green
        Write-Host "🎯 Target application will open automatically" -ForegroundColor Yellow
        Write-Host "📝 Use the console to run individual or combined attacks" -ForegroundColor Yellow
    }
    catch {
        Write-Host "❌ Failed to open browser: $_" -ForegroundColor Red
    }
    
    # Clean up after 60 seconds
    Start-Job -ScriptBlock {
        Start-Sleep 60
        if (Test-Path "red-team-console.html") {
            Remove-Item "red-team-console.html" -Force
        }
    } | Out-Null
}

# Function to run API testing with curl/Invoke-RestMethod
function Start-ApiTesting {
    Write-Host "🔌 Starting API Security Testing..." -ForegroundColor Cyan
    
    $endpoints = @(
        "/api/queue/join",
        "/api/queue/status", 
        "/api/queue/monitor",
        "/select-branch",
        "/select-product",
        "/confirmation"
    )
    
    Write-Host "🎯 Testing Rate Limiting..." -ForegroundColor Yellow
    
    foreach ($endpoint in $endpoints) {
        Write-Host "Testing: $endpoint" -ForegroundColor White
        
        $requests = @()
        $rateLimitHits = 0
        
        # Send rapid requests to test rate limiting
        for ($i = 1; $i -le 20; $i++) {
            try {
                $response = Invoke-RestMethod -Uri "$BASE_URL$endpoint" -Method GET -Headers @{
                    "User-Agent" = "RedTeam-PowerShell-Tester"
                    "X-Attack-Test" = "rate-limit-$i"
                } -TimeoutSec 5 -ErrorAction SilentlyContinue
                
                $requests += @{
                    Request = $i
                    Status = "Success"
                    Timestamp = Get-Date
                }
            }
            catch {
                if ($_.Exception.Response.StatusCode -eq 429) {
                    $rateLimitHits++
                    Write-Host "  ✅ Rate limit triggered on request $i" -ForegroundColor Green
                }
                
                $requests += @{
                    Request = $i
                    Status = "Error: $($_.Exception.Message)"
                    Timestamp = Get-Date
                }
            }
            
            # Small delay between requests
            Start-Sleep -Milliseconds 100
        }
        
        $successRate = ($requests | Where-Object { $_.Status -eq "Success" }).Count / 20 * 100
        Write-Host "  📊 Success rate: $successRate% (lower is better for security)" -ForegroundColor Yellow
        Write-Host "  🛡️  Rate limit hits: $rateLimitHits" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Function to generate attack report
function Generate-AttackReport {
    Write-Host "📊 Generating Red Team Attack Report..." -ForegroundColor Cyan
    
    $reportContent = @"
# 🔴 Red Team Attack Testing Report
Generated: $(Get-Date)
Target: $BASE_URL

## Test Summary
This report contains the results of comprehensive security testing performed by the Red Team against the Dev War reservation system.

## Tests Executed
- ✅ K6 Load Testing (Concurrent user simulation)
- ✅ API Rate Limiting Testing (Spam protection)
- ✅ Browser-based Attack Scripts (Client-side testing)
- ✅ Queue Bypass Attempts (Authorization testing)
- ✅ Form Manipulation Testing (Input validation)

## Security Assessment Criteria
- **Rate Limiting**: System should block excessive requests
- **Queue Protection**: Bypass attempts should be prevented
- **Input Validation**: Invalid data should be rejected
- **Session Management**: Multi-tab abuse should be detected
- **Error Handling**: System should fail securely

## Recommendations
1. Monitor rate limiting effectiveness
2. Review security logs for patterns
3. Test under realistic user loads
4. Implement additional monitoring
5. Regular security testing schedule

## Next Steps
1. Analyze detailed test results
2. Fix any discovered vulnerabilities
3. Re-test after security improvements
4. Document security procedures
5. Plan regular Red Team exercises

---
🔴 Red Team Testing Complete
🛡️ Security is a continuous process
"@
    
    $reportFile = "RED-TEAM-ATTACK-REPORT-$(Get-Date -Format 'yyyyMMdd-HHmm').md"
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Host "✅ Report generated: $reportFile" -ForegroundColor Green
}

# Main menu function
function Show-MainMenu {
    Write-Host ""
    Write-Host "🔴 RED TEAM ATTACK OPTIONS" -ForegroundColor Red
    Write-Host "========================" -ForegroundColor Red
    Write-Host "1. 🚀 Run K6 Load Testing (All Scenarios)" -ForegroundColor White
    Write-Host "2. 📈 Run K6 Load Attack Only" -ForegroundColor White
    Write-Host "3. 🌊 Run K6 API Spam Test" -ForegroundColor White
    Write-Host "4. 🚪 Run K6 Queue Bypass Test" -ForegroundColor White
    Write-Host "5. ⏱️  Run K6 Rate Limit Test" -ForegroundColor White
    Write-Host "6. 🌐 Launch Browser Attack Console" -ForegroundColor White
    Write-Host "7. 🔌 Run API Security Testing" -ForegroundColor White
    Write-Host "8. 📊 Generate Attack Report" -ForegroundColor White
    Write-Host "9. 🎯 Open Target Application" -ForegroundColor White
    Write-Host "0. 🚪 Exit" -ForegroundColor White
    Write-Host ""
}

# Main execution
if (-not (Test-Prerequisites)) {
    Write-Host "❌ Prerequisites not met. Exiting." -ForegroundColor Red
    exit 1
}

do {
    Show-MainMenu
    $choice = Read-Host "Select an option (0-9)"
    
    switch ($choice) {
        "1" { Start-LoadTesting -TestType "all" }
        "2" { Start-LoadTesting -TestType "load" }
        "3" { Start-LoadTesting -TestType "spam" }
        "4" { Start-LoadTesting -TestType "bypass" }
        "5" { Start-LoadTesting -TestType "ratelimit" }
        "6" { Start-BrowserAttacks }
        "7" { Start-ApiTesting }
        "8" { Generate-AttackReport }
        "9" { 
            Write-Host "🎯 Opening target application..." -ForegroundColor Yellow
            Start-Process $BASE_URL
        }
        "0" { 
            Write-Host "🔴 Red Team testing session ended." -ForegroundColor Red
            break
        }
        default { 
            Write-Host "❌ Invalid option. Please select 0-9." -ForegroundColor Red
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Read-Host "Press Enter to continue..."
    }
    
} while ($choice -ne "0")

Write-Host ""
Write-Host "🔴 RED TEAM MISSION COMPLETE" -ForegroundColor Red
Write-Host "🛡️  Review results and strengthen defenses!" -ForegroundColor Yellow
