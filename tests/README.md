# 🧪 Tests Directory

โฟลเดอร์นี้รวมรวมการทดสอบทั้งหมดของระบบ Dev War

## 📁 โครงสร้างโฟลเดอร์

### `/k6/` - K6 Load Testing Scripts

- `k6-load-test.js` - การทดสอบ load พื้นฐาน
- `k6-spam-test.js` - การทดสอบ spam protection
- `k6-red-team-attacks.js` - การทดสอบ Red Team attacks แบบครอบคลุม
- `k6-captcha-security.js` - **การทดสอบ CAPTCHA security และ bypass attacks**

### `/red-team/` - Red Team Attack Scripts

- `browser-attacks.js` - Browser-based attack scripts สำหรับ client-side testing
- `captcha-bypass-attacks.js` - **CAPTCHA bypass และ security vulnerability tests**

### `/scripts/` - Testing Automation Scripts

- `red-team-testing.ps1` - PowerShell script สำหรับรัน Red Team tests
- `run-tests.ps1` - PowerShell script สำหรับรัน tests ทั่วไป
- `captcha-security-tests.ps1` - **PowerShell script สำหรับรัน CAPTCHA security tests**
- `run-tests.sh` - Bash script สำหรับรัน tests ทั่วไป

## 🚀 การใช้งาน

### K6 Load Testing

```bash
# รัน load test พื้นฐาน
k6 run tests/k6/k6-load-test.js

# รัน spam test
k6 run tests/k6/k6-spam-test.js

# รัน Red Team attacks
k6 run tests/k6/k6-red-team-attacks.js
```

### Red Team Browser Testing

```javascript
// โหลดใน browser console หรือ HTML page
<script src="tests/red-team/browser-attacks.js"></script>;

// รัน attacks
RedTeamAttacker.runAllAttacks();
RedTeamAttacker.runSingleAttack("load");
```

### Automation Scripts

```powershell
# PowerShell
.\tests\scripts\red-team-testing.ps1

# CAPTCHA Security Tests
.\tests\scripts\captcha-security-tests.ps1

# Bash
./tests/scripts/run-tests.sh
```

## �️ CAPTCHA Security Testing

### วิธีการทดสอบ CAPTCHA

#### 1. Browser-based Tests

```javascript
// เปิด browser ไปที่ http://localhost:3000
// เปิด Developer Console (F12)
// รันคำสั่ง:
fetch("/captcha-tests.js")
  .then((r) => r.text())
  .then(eval);
captchaSecurityTests.runAll();
```

#### 2. K6 Load Tests

```powershell
# รัน CAPTCHA bypass tests
.\tests\scripts\captcha-security-tests.ps1 bypass

# รัน CAPTCHA stress tests
.\tests\scripts\captcha-security-tests.ps1 stress

# รัน CAPTCHA validation tests
.\tests\scripts\captcha-security-tests.ps1 validation

# รันทุก tests พร้อม generate report
.\tests\scripts\captcha-security-tests.ps1 -GenerateReport
```

### การทดสอบที่ครอบคลุม

**🔓 Bypass Attack Tests:**

- No CAPTCHA token submission
- Invalid/fake token attempts
- Expired token reuse
- Token replay attacks
- Header manipulation

**⚡ Stress Tests:**

- High concurrent CAPTCHA requests
- Performance under load
- Response time validation

**🔍 Validation Tests:**

- Various token formats
- Malformed token handling
- Environment manipulation attempts

## �📊 Test Types

### 🔴 Red Team Attacks

1. **Load Testing** - จำลอง users จำนวนมาก
2. **API Spam** - Flood API endpoints
3. **Queue Bypass** - พยายาม bypass queue system
4. **Form Manipulation** - ทดสอบ input validation
5. **Multi-tab Abuse** - ทดสอบ cross-tab protection
6. **🛡️ CAPTCHA Bypass** - พยายาม bypass CAPTCHA protection

### 🛡️ Security Testing

- Rate limiting effectiveness
- Session management
- Input validation
- **CAPTCHA validation**
- **Token verification**
- Error handling
- Network resilience

## 🎯 Testing Objectives

1. **Performance** - ระบบต้องรับมือกับ load ได้
2. **Security** - ป้องกัน attacks ได้อย่างมีประสิทธิภาพ
3. **🛡️ CAPTCHA Security** - CAPTCHA ป้องกัน bot attacks ได้
4. **Resilience** - กู้คืนได้หลังจาก attacks
5. **User Experience** - ผู้ใช้ปกติไม่ได้รับผลกระทบ

---

**สำคัญ:** การทดสอบเหล่านี้ควรรันในสิ่งแวดล้อมทดสอบเท่านั้น ไม่ใช่ production!
