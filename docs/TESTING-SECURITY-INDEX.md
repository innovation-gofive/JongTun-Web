# 🎯 Dev War Testing & Security Index

ไฟล์ index หลักสำหรับ navigate ไปยังการทดสอบและเอกสาร security ต่าง ๆ

## 📁 โครงสร้างโปรเจ็คที่จัดระเบียบแล้ว

```
dev-war/
├── 📂 tests/                          # การทดสอบทั้งหมด
│   ├── 📂 k6/                         # K6 load testing scripts
│   │   ├── k6-load-test.js           # Load testing พื้นฐาน
│   │   ├── k6-spam-test.js           # Spam protection testing
│   │   ├── k6-red-team-attacks.js    # Red Team attacks ครอบคลุม
│   │   └── README.md                 # คู่มือ K6 testing
│   ├── 📂 red-team/                   # Red Team attack scripts
│   │   ├── browser-attacks.js        # Browser-based attacks
│   │   └── README.md                 # คู่มือ Red Team attacks
│   ├── 📂 scripts/                    # Automation scripts
│   │   ├── red-team-testing.ps1      # Interactive testing suite
│   │   ├── run-tests.ps1             # PowerShell basic tests
│   │   ├── run-tests.sh              # Bash basic tests
│   │   └── README.md                 # คู่มือ automation scripts
│   └── README.md                     # คู่มือการทดสอบหลัก
├── 📂 docs/                          # เอกสารโปรเจ็ค
│   ├── 📂 security/                   # เอกสาร security
│   │   ├── blue-team-security-report.md    # รายงาน Blue Team
│   │   ├── dev-war-security-summary.md     # สรุป security project
│   │   └── README.md                       # คู่มือ security docs
│   └── (เอกสารอื่น ๆ)
└── 📂 src/                           # Source code
    ├── 📂 lib/                        # Security libraries
    │   ├── client-rate-limit.ts      # Rate limiting system
    │   └── tab-sync.ts               # Cross-tab protection
    └── (source code อื่น ๆ)
```

## 🚀 Quick Start Guide

### 1. เริ่มต้นการทดสอบ Red Team

```powershell
# วิธีที่ง่ายที่สุด - Interactive menu
.\tests\scripts\red-team-testing.ps1

# เลือกจากเมนู:
# 1. รัน K6 Load Testing
# 6. เปิด Browser Attack Console
```

### 2. รัน K6 Testing แบบ Manual

```bash
# Load testing
k6 run tests/k6/k6-load-test.js

# Red Team attacks
k6 run tests/k6/k6-red-team-attacks.js

# Spam testing
k6 run tests/k6/k6-spam-test.js
```

### 3. Browser-based Attacks

```javascript
// โหลดใน browser console
// หรือสร้าง HTML page ที่ load script นี้
<script src="tests/red-team/browser-attacks.js"></script>;

// รัน attacks
RedTeamAttacker.runAllAttacks();
```

## 📊 Testing Scenarios

### 🔴 Red Team Attacks

1. **Load Testing** - จำลอง 1000+ users
2. **API Spam** - Flood API endpoints
3. **Queue Bypass** - พยายาม skip queue
4. **Form Manipulation** - ทดสอบ input validation
5. **Multi-tab Abuse** - ทดสอบ session management

### 🛡️ Blue Team Defenses

1. **Rate Limiting** - ป้องกัน API spam
2. **Tab Synchronization** - ป้องกัน multi-tab abuse
3. **Input Validation** - ป้องกัน form manipulation
4. **Network Resilience** - จัดการ connection issues
5. **Security Monitoring** - Real-time status display

## 📖 Documentation Links

### การทดสอบ

- [📋 Tests Overview](tests/README.md)
- [📊 K6 Load Testing](tests/k6/README.md)
- [🔴 Red Team Attacks](tests/red-team/README.md)
- [🤖 Automation Scripts](tests/scripts/README.md)

### Security

- [🛡️ Security Documentation](docs/security/README.md)
- [📊 Blue Team Report](docs/security/blue-team-security-report.md)
- [📋 Security Summary](docs/security/dev-war-security-summary.md)

## 🎯 Success Criteria

### Performance Metrics

- Response time < 5 วินาที (95th percentile)
- System stability during 1000+ concurrent users
- Graceful degradation under attack

### Security Metrics

- 95%+ spam requests blocked by rate limiting
- 100% queue bypass attempts blocked
- 100% multi-tab abuse detection
- 95%+ invalid input rejection

### User Experience

- <5% performance impact for normal users
- Clear feedback during security events
- <30 seconds recovery after attacks

## ⚡ ทดสอบด่วน (Quick Test)

```bash
# 1. Start application
npm run dev

# 2. Run comprehensive test (PowerShell)
.\tests\scripts\red-team-testing.ps1

# 3. Select option 1 (Run All Attacks)
# 4. Review results and security responses
```

---

**🔴 Red Team vs 🛡️ Blue Team - พร้อมสำหรับการต่อสู้!**

**ใช้ index นี้เป็นจุดเริ่มต้นสำหรับการทดสอบและการพัฒนาระบบป้องกัน**
