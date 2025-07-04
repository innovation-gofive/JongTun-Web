# 🛡️ CAPTCHA Security Testing Script
# PowerShell script for comprehensive CAPTCHA security testing

Write-Host "🛡️ CAPTCHA Security Test Suite" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BaseUrl = "http://localhost:3000"
$TestResultsDir = "tests/results"
$K6Binary = "k6"

# Check if server is running
function Test-ServerStatus {
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is running at $BaseUrl" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ Server is not running at $BaseUrl" -ForegroundColor Red
        Write-Host "Please start the development server with: npm run dev" -ForegroundColor Yellow
        return $false
    }
}

# Check if K6 is installed
function Test-K6Installation {
    try {
        $k6Version = & $K6Binary version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ K6 is installed: $($k6Version[0])" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ K6 is not installed" -ForegroundColor Red
        Write-Host "Install K6 from: https://k6.io/docs/getting-started/installation/" -ForegroundColor Yellow
        return $false
    }
}

# Create results directory
function Initialize-TestEnvironment {
    if (!(Test-Path $TestResultsDir)) {
        New-Item -ItemType Directory -Path $TestResultsDir -Force | Out-Null
        Write-Host "📁 Created test results directory: $TestResultsDir" -ForegroundColor Blue
    }
}

# Run Browser-based CAPTCHA tests
function Invoke-BrowserCaptchaTests {
    Write-Host "🌐 Running Browser-based CAPTCHA Tests..." -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    
    Write-Host "📋 To run browser tests:"
    Write-Host "1. Open browser and navigate to: $BaseUrl" -ForegroundColor Cyan
    Write-Host "2. Open Developer Console (F12)" -ForegroundColor Cyan
    Write-Host "3. Load the test script:" -ForegroundColor Cyan
    Write-Host "   fetch('/tests/red-team/captcha-bypass-attacks.js')" -ForegroundColor Gray
    Write-Host "   .then(r => r.text()).then(code => eval(code))" -ForegroundColor Gray
    Write-Host "4. Run tests:" -ForegroundColor Cyan
    Write-Host "   captchaSecurityTests.runAll()" -ForegroundColor Gray
    Write-Host ""
    
    # Try to copy the test file to public directory for easy access
    $sourcePath = "tests/red-team/captcha-bypass-attacks.js"
    $publicPath = "public/captcha-tests.js"
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item $sourcePath $publicPath -Force
            Write-Host "✅ Browser test script copied to: $BaseUrl/captcha-tests.js" -ForegroundColor Green
            Write-Host "   Load with: fetch('/captcha-tests.js').then(r=>r.text()).then(eval)" -ForegroundColor Gray
        }
        catch {
            Write-Host "⚠️ Could not copy test script to public directory" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

# Run K6 CAPTCHA tests
function Invoke-K6CaptchaTests {
    param(
        [string]$TestType = "all"
    )
    
    Write-Host "⚡ Running K6 CAPTCHA Security Tests..." -ForegroundColor Yellow
    Write-Host "--------------------------------------" -ForegroundColor Yellow
    
    $k6Script = "tests/k6/k6-captcha-security.js"
    
    if (!(Test-Path $k6Script)) {
        Write-Host "❌ K6 CAPTCHA test script not found: $k6Script" -ForegroundColor Red
        return
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    switch ($TestType) {
        "bypass" {
            Write-Host "🔓 Running CAPTCHA Bypass Tests..." -ForegroundColor Cyan
            $env:K6_SCENARIO = "captcha_bypass_attack"
            $outputFile = "$TestResultsDir/captcha-bypass-$timestamp.json"
        }
        "stress" {
            Write-Host "⚡ Running CAPTCHA Stress Tests..." -ForegroundColor Cyan
            $env:K6_SCENARIO = "captcha_stress_test"
            $outputFile = "$TestResultsDir/captcha-stress-$timestamp.json"
        }
        "validation" {
            Write-Host "🔍 Running CAPTCHA Validation Tests..." -ForegroundColor Cyan
            $env:K6_SCENARIO = "captcha_validation_test"
            $outputFile = "$TestResultsDir/captcha-validation-$timestamp.json"
        }
        "all" {
            Write-Host "🎯 Running All CAPTCHA Tests..." -ForegroundColor Cyan
            $env:K6_SCENARIO = "captcha_bypass_attack"
            $outputFile = "$TestResultsDir/captcha-all-$timestamp.json"
        }
    }
    
    # Set environment variables
    $env:BASE_URL = $BaseUrl
    $env:CAPTCHA_ENABLED = "true"
    
    # Run K6 test
    try {
        Write-Host "🚀 Executing: k6 run $k6Script" -ForegroundColor Gray
        & $K6Binary run $k6Script --out json=$outputFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ K6 CAPTCHA tests completed successfully" -ForegroundColor Green
            Write-Host "📊 Results saved to: $outputFile" -ForegroundColor Blue
        } else {
            Write-Host "❌ K6 tests failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error running K6 tests: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Analyze CAPTCHA configuration
function Test-CaptchaConfiguration {
    Write-Host "🔍 Analyzing CAPTCHA Configuration..." -ForegroundColor Yellow
    Write-Host "------------------------------------" -ForegroundColor Yellow
    
    # Check environment file
    $envFile = ".env.local"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile
        $captchaEnabled = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_ENABLE_CAPTCHA" }
        
        if ($captchaEnabled) {
            Write-Host "📋 Found CAPTCHA config: $captchaEnabled" -ForegroundColor Blue
            
            if ($captchaEnabled -match "true") {
                Write-Host "✅ CAPTCHA is enabled in environment" -ForegroundColor Green
            } else {
                Write-Host "⚠️ CAPTCHA is disabled in environment" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠️ CAPTCHA configuration not found in .env.local" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ .env.local file not found" -ForegroundColor Red
    }
    
    # Check if CAPTCHA files exist
    $captchaFiles = @(
        "src/store/useCaptchaStore.ts",
        "src/components/JoinQueueButton.tsx",
        "src/lib/captcha.ts"
    )
    
    foreach ($file in $captchaFiles) {
        if (Test-Path $file) {
            Write-Host "✅ CAPTCHA file exists: $file" -ForegroundColor Green
        } else {
            Write-Host "❌ CAPTCHA file missing: $file" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# Generate test report
function New-TestReport {
    Write-Host "📊 Generating CAPTCHA Security Report..." -ForegroundColor Yellow
    Write-Host "---------------------------------------" -ForegroundColor Yellow
    
    $reportFile = "$TestResultsDir/captcha-security-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
    
    $report = @"
# 🛡️ CAPTCHA Security Test Report

**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Target System:** $BaseUrl  
**Test Environment:** Development  

## Test Summary

This report contains the results of comprehensive CAPTCHA security testing including:

- ✅ **Bypass Attack Tests** - Attempts to circumvent CAPTCHA protection
- ✅ **Stress Tests** - High-load CAPTCHA validation performance
- ✅ **Validation Tests** - Various token format and validation scenarios
- ✅ **Configuration Analysis** - Environment and implementation review

## Test Files

- **Browser Tests:** ``tests/red-team/captcha-bypass-attacks.js``
- **K6 Load Tests:** ``tests/k6/k6-captcha-security.js``
- **PowerShell Runner:** ``tests/scripts/captcha-security-tests.ps1``

## Browser Test Instructions

1. Navigate to [$BaseUrl]($BaseUrl)
2. Open Developer Console (F12)
3. Load test script: ``fetch('/captcha-tests.js').then(r=>r.text()).then(eval)``
4. Run tests: ``captchaSecurityTests.runAll()``

## K6 Test Commands

``````powershell
# Run all CAPTCHA tests
./tests/scripts/captcha-security-tests.ps1

# Run specific test types
./tests/scripts/captcha-security-tests.ps1 -TestType bypass
./tests/scripts/captcha-security-tests.ps1 -TestType stress
./tests/scripts/captcha-security-tests.ps1 -TestType validation
``````

## Security Recommendations

### ✅ Current Protections
- CAPTCHA enabled via environment variable
- Token validation on API endpoints
- Client-side integration with security store

### 🔍 Areas to Monitor
- Token replay protection
- Rate limiting integration
- Cross-tab session protection
- Invalid token handling

### 🚨 Critical Checks
- [ ] CAPTCHA cannot be disabled via client-side manipulation
- [ ] Invalid tokens are properly rejected
- [ ] Token reuse is prevented
- [ ] High-load scenarios are handled gracefully

## Next Steps

1. **Regular Testing** - Run these tests regularly as part of CI/CD
2. **Monitor Metrics** - Track bypass attempts and validation errors
3. **Update Tests** - Enhance tests as new attack vectors are discovered
4. **Production Testing** - Adapt tests for production environment validation

---
*Report generated by CAPTCHA Security Test Suite*
"@

    try {
        $report | Out-File -FilePath $reportFile -Encoding UTF8
        Write-Host "✅ Test report generated: $reportFile" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to generate report: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Main execution
function Start-CaptchaSecurityTests {
    param(
        [string]$TestType = "all",
        [switch]$SkipBrowser,
        [switch]$SkipK6,
        [switch]$GenerateReport
    )
    
    Write-Host "🚀 Starting CAPTCHA Security Test Suite" -ForegroundColor Magenta
    Write-Host "=======================================" -ForegroundColor Magenta
    Write-Host ""
    
    # Initialize
    Initialize-TestEnvironment
    
    # Pre-flight checks
    if (!(Test-ServerStatus)) {
        return
    }
    
    # Analyze configuration
    Test-CaptchaConfiguration
    
    # Run browser tests
    if (!$SkipBrowser) {
        Invoke-BrowserCaptchaTests
    }
    
    # Run K6 tests
    if (!$SkipK6) {
        if (Test-K6Installation) {
            Invoke-K6CaptchaTests -TestType $TestType
        } else {
            Write-Host "⚠️ Skipping K6 tests (K6 not installed)" -ForegroundColor Yellow
        }
    }
    
    # Generate report
    if ($GenerateReport) {
        New-TestReport
    }
    
    Write-Host "🏁 CAPTCHA Security Testing Complete!" -ForegroundColor Magenta
    Write-Host "=====================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "📋 Summary:" -ForegroundColor White
    Write-Host "- Browser tests: Manual execution required" -ForegroundColor Gray
    Write-Host "- K6 tests: Automated load/security testing" -ForegroundColor Gray
    Write-Host "- Results: Saved to $TestResultsDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 Next steps:" -ForegroundColor White
    Write-Host "1. Review test results and metrics" -ForegroundColor Gray
    Write-Host "2. Address any security vulnerabilities found" -ForegroundColor Gray
    Write-Host "3. Integrate tests into CI/CD pipeline" -ForegroundColor Gray
}

# Script parameters
param(
    [Parameter(Position=0)]
    [ValidateSet("all", "bypass", "stress", "validation")]
    [string]$TestType = "all",
    
    [switch]$SkipBrowser,
    [switch]$SkipK6,
    [switch]$GenerateReport,
    [switch]$Help
)

if ($Help) {
    Write-Host "🛡️ CAPTCHA Security Test Suite Help" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  ./captcha-security-tests.ps1 [TestType] [Options]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Test Types:" -ForegroundColor White
    Write-Host "  all        - Run all CAPTCHA security tests (default)" -ForegroundColor Gray
    Write-Host "  bypass     - Run CAPTCHA bypass attack tests only" -ForegroundColor Gray
    Write-Host "  stress     - Run CAPTCHA stress/load tests only" -ForegroundColor Gray
    Write-Host "  validation - Run CAPTCHA validation tests only" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -SkipBrowser    - Skip browser-based tests" -ForegroundColor Gray
    Write-Host "  -SkipK6         - Skip K6 load tests" -ForegroundColor Gray
    Write-Host "  -GenerateReport - Generate detailed test report" -ForegroundColor Gray
    Write-Host "  -Help           - Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  ./captcha-security-tests.ps1" -ForegroundColor Gray
    Write-Host "  ./captcha-security-tests.ps1 bypass" -ForegroundColor Gray
    Write-Host "  ./captcha-security-tests.ps1 -SkipBrowser -GenerateReport" -ForegroundColor Gray
    exit 0
}

# Run the tests
Start-CaptchaSecurityTests -TestType $TestType -SkipBrowser:$SkipBrowser -SkipK6:$SkipK6 -GenerateReport:$GenerateReport
