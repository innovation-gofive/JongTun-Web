#!/bin/bash

# Dev War K6 Test Runner (Bash version)
# Runs both load test and spam test to validate our core problem solutions

echo "🎯 Dev War Reservation System - Performance Test Suite"
echo "============================================================"

# Check if K6 is installed
if command -v k6 &> /dev/null; then
    echo "✅ K6 detected: $(k6 version | head -n1)"
else
    echo "❌ K6 not found. Please install K6 from https://k6.io/"
    exit 1
fi

# Check if Next.js server is running
BASE_URL="http://localhost:3000"
if curl -s "$BASE_URL/api/queue/status" &> /dev/null; then
    echo "✅ Next.js server detected at $BASE_URL"
else
    echo "❌ Next.js server not responding at $BASE_URL"
    echo "   Please start your server with: npm run dev"
    exit 1
fi

echo ""
echo "🚀 Starting Test Suite..."
echo ""

# Run Load Test
echo "📊 Phase 1: Load Test (Normal Usage Pattern)"
echo "   Testing: 500 users, 5-second polling, 1 minute duration"
echo "   Purpose: Validate baseline performance and scalability"
echo ""

if k6 run k6-load-test.js; then
    echo "✅ Load Test completed successfully!"
else
    echo "❌ Load Test failed!"
fi

echo ""
echo "⏱️  Waiting 5 seconds before spam test..."
sleep 5

# Run Spam Test
echo "🔥 Phase 2: Spam Test (Rate Limiter Validation)"
echo "   Testing: 5 aggressive users, maximum request rate, 10 seconds"
echo "   Purpose: Verify Problem #2 (Server Overload) solution"
echo "   Expected: High rate of 429 responses (this proves success!)"
echo ""

if k6 run k6-spam-test.js; then
    echo "✅ Spam Test completed successfully!"
else
    echo "❌ Spam Test failed!"
fi

echo ""
echo "🎉 Test Suite Complete!"
echo "============================================================"
echo ""
echo "📋 Test Summary:"
echo "   ✓ Load Test: Validates system performance under normal load"
echo "   ✓ Spam Test: Validates rate limiter protects against overload"
echo ""
echo "🎯 Key Success Indicators:"
echo "   • Load Test: <10% error rate, <2s response times"
echo "   • Spam Test: >70% rate limiting (429 responses)"
echo ""
echo "🏆 High rate limiting in spam test = Problem #2 SOLVED!"
echo ""
