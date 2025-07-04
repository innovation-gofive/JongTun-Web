# 🎯 Dev War - Queue Management System

## 📋 Project Overview

**Queue Management System** ที่ทำงานแบบ **Self-Service** โดยมีระบบ **CAPTCHA** และ **Bot Detection** สำหรับป้องกันการใช้งานที่ไม่เหมาะสม

### ✨ Key Features

- 🤖 **Smart CAPTCHA**: Adaptive CAPTCHA ที่แสดงเฉพาะเมื่อเสี่ยงสูง
- 🛡️ **Bot Detection**: ตรวจจับพฤติกรรมผิดปกติแบบ real-time
- 🚀 **Self-Service**: ทำงานอัตโนมัติ 24/7 ไม่ต้องมี admin
- 🔄 **Auto-Processing**: ประมวลผลผู้ใช้ทุก 30 วินาที
- 💾 **State Management**: ใช้ Zustand สำหรับจัดการ state
- 🎨 **Modern UI**: Glass morphism design

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (Upstash)
- Environment variables

### Installation

```bash
npm install
cp .env.local.example .env.local
# แก้ไข environment variables
npm run dev
```

### Environment Variables

```bash
# Queue System
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
MAX_QUEUE_SIZE=1000
QUEUE_TIMEOUT_SECONDS=300

# CAPTCHA (Optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
ENABLE_CAPTCHA=false
CAPTCHA_THRESHOLD=0.5

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_RPM=60
```

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/queue/               # Queue API endpoints
│   ├── waiting-room/            # Waiting room page
│   ├── select-product/          # Product selection
│   ├── select-branch/           # Branch selection
│   └── confirmation/            # Confirmation page
├── components/                   # UI Components
│   ├── JoinQueueButton.tsx      # Main queue join button
│   ├── CaptchaToggle.tsx        # CAPTCHA dev controls
│   ├── WorkflowProgress.tsx     # Progress indicator
│   └── ui/                      # UI primitives
├── store/                       # State Management
│   ├── useQueueStore.ts         # Queue state (Zustand)
│   ├── useCaptchaStore.ts       # CAPTCHA state
│   └── useReservationStore.ts   # Reservation state
├── lib/                         # Utilities & Logic
│   ├── queue-utils.ts           # Queue management
│   ├── captcha.ts               # CAPTCHA utilities
│   ├── bot-detection.ts         # Bot detection engine
│   ├── auto-queue-processor.ts  # Auto processing
│   ├── error-handling.ts        # Error management
│   ├── security.ts              # Security utilities
│   └── logger.ts                # Logging system
└── docs/                        # Documentation
```

---

## 🛡️ Security Features

### CAPTCHA System

- **Adaptive Display**: แสดงเฉพาะเมื่อเสี่ยงสูง
- **Fail-Safe Design**: ระบบทำงานต่อแม้ CAPTCHA ล้มเหลว
- **Google reCAPTCHA v3**: Invisible CAPTCHA
- **Smart Bot Detection**: ประเมิน risk score real-time

### Bot Detection Metrics

- **Request Frequency** (น้ำหนัก 30%)
- **Human Interactions** (น้ำหนัก 25%)
- **Time on Page** (น้ำหนัก 20%)
- **User Agent Analysis** (น้ำหนัก 15%)
- **Click Speed** (น้ำหนัก 10%)

### Additional Security

- CSRF Protection
- Rate Limiting (60 requests/minute)
- Input Validation
- Circuit Breaker
- Error Handling & Fallback

---

## 🎮 Testing

### Development Testing

```bash
# Enable CAPTCHA for testing
ENABLE_CAPTCHA=true
NEXT_PUBLIC_ENABLE_CAPTCHA=true

# Use CaptchaToggle on homepage
# Test different scenarios
```

### Performance Testing

```bash
# Install K6
# Run load tests
k6 run k6-load-test.js      # Normal load (500 users)
k6 run k6-spam-test.js      # Rate limiter test (5 aggressive users)

# Or run both
./run-tests.ps1
```

### Expected Results

- **Load Test**: >95% success rate, <1s response time
- **Spam Test**: >70% rate limited (429 status)

---

## 📊 Monitoring & Logging

### Key Events

- `QUEUE_JOIN_REQUEST` - ผู้ใช้เข้าร่วมคิว
- `CAPTCHA_VERIFICATION` - ผลการตรวจสอบ CAPTCHA
- `BOT_DETECTION_ASSESSMENT` - ผลการประเมิน risk
- `SMART_CAPTCHA_DECISION` - การตัดสินใจแสดง CAPTCHA
- `AUTO_QUEUE_PROCESSING` - การประมวลผลอัตโนมัติ

### Metrics to Monitor

- CAPTCHA success rate
- Bot detection accuracy
- Queue processing efficiency
- User experience impact
- System performance

---

## 🔧 Configuration

### Auto-Processing Settings

```typescript
{
  enabled: true,
  processingInterval: 30000,    // 30 seconds
  batchSize: 5,                 // 5 users per batch
  maxConcurrentUsers: 20,       // Max 20 users allowed
  businessHours: {
    enabled: false,             // 24/7 operation
    start: "09:00",
    end: "17:00",
    timezone: "Asia/Bangkok"
  }
}
```

### CAPTCHA Settings

```typescript
{
  enabled: false,               // Default disabled
  threshold: 0.5,               // reCAPTCHA score threshold
  adaptiveMode: true,           // Smart bot detection
  version: "v3",                // Invisible CAPTCHA
  riskThresholds: {
    allow: 0.4,                 // 0.0-0.4: Allow
    captcha: 0.8,               // 0.4-0.8: Show CAPTCHA
    block: 1.0                  // 0.8-1.0: Block
  }
}
```

---

## 🎯 User Flow

1. **Homepage** → User sees Reserve Now button
2. **Click Reserve** → Bot detection collects metrics
3. **Risk Assessment** → System decides if CAPTCHA needed
4. **CAPTCHA (Optional)** → Show if risk score > 0.4
5. **Join Queue** → Add to queue or auto-approve
6. **Waiting Room** → Real-time status updates
7. **Auto-Processing** → System processes queue every 30s
8. **Product Selection** → Choose products and branch
9. **Confirmation** → Final reservation details

---

## 🚀 Deployment

### Production Checklist

- [ ] Set production environment variables
- [ ] Replace CAPTCHA test keys with production keys
- [ ] Configure Redis production instance
- [ ] Set up monitoring and alerting
- [ ] Enable CAPTCHA (`ENABLE_CAPTCHA=true`)
- [ ] Test all flows end-to-end

### Environment-Specific Settings

```bash
# Development
NODE_ENV=development
ENABLE_CAPTCHA=false
DEBUG_MODE=true

# Production
NODE_ENV=production
ENABLE_CAPTCHA=true
DEBUG_MODE=false
```

---

## 📚 Additional Documentation

- 📖 **[Self-Service Details](docs/SELF-SERVICE.md)** - ระบบ auto-processing
- 🧪 **[Testing Guide](docs/TESTING.md)** - การทดสอบครับถ้วน
- 🛡️ **[CAPTCHA Implementation](docs/CAPTCHA.md)** - รายละเอียด CAPTCHA
- 📊 **[Validation Results](docs/VALIDATION.md)** - ผลการทดสอบ

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🎯 Status

**✅ Production Ready** - CAPTCHA integration complete, all tests passing, ready for deployment.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
