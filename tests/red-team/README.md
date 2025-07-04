# 🔴 Red Team Attack Scripts

Browser-based attack scripts สำหรับทดสอบ client-side security

## 📋 Scripts ในโฟลเดอร์นี้

### `browser-attacks.js`

ชุด attack scripts ที่รันใน browser เพื่อทดสอบ:

1. **Load Testing Attack** - จำลอง concurrent users
2. **API Spam Attack** - Flood API endpoints
3. **Queue Bypass Attack** - พยายาม bypass queue system
4. **API Failure Simulation** - ทดสอบ resilience
5. **Form Manipulation Attack** - ทดสอบ input validation

## 🚀 การใช้งาน

### วิธีที่ 1: HTML Page

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Red Team Console</title>
  </head>
  <body>
    <script src="browser-attacks.js"></script>
    <script>
      // รัน all attacks
      RedTeamAttacker.runAllAttacks();

      // รัน specific attack
      RedTeamAttacker.runSingleAttack("load");
    </script>
  </body>
</html>
```

### วิธีที่ 2: Browser Console

```javascript
// โหลด script ใน console
// แล้วรัน commands

RedTeamAttacker.runAllAttacks();
RedTeamAttacker.runSingleAttack("spam");
RedTeamAttacker.runSingleAttack("bypass");
```

### วิธีที่ 3: Automation Script

```powershell
# ใช้ PowerShell script ที่มี UI
..\scripts\red-team-testing.ps1
```

## ⚔️ Attack Types

### 1. Load Testing Attack

- จำลอง 1000+ concurrent users
- ส่ง API requests พร้อมกัน
- วัด response time และ success rate

### 2. API Spam Attack

- Flood API endpoints ด้วย rapid requests
- ทดสอบ rate limiting effectiveness
- วัด rate limit hit rate

### 3. Queue Bypass Attack

- ลอง access protected pages โดยตรง
- จัดการ localStorage manipulation
- ทดสอบ multi-tab abuse

### 4. API Failure Simulation

- จำลอง network timeout
- จำลอง server errors (500)
- ทดสอบ offline behavior

### 5. Form Manipulation Attack

- ทดสอบ quantity overflow
- ลอง negative values
- ทดสอบ XSS injection

## 🛡️ Expected Security Responses

ระบบควรป้องกันได้:

- Rate limiting ต้องทำงาน (429 responses)
- Bypass attempts ต้องถูกบล็อค (403/401)
- Invalid inputs ต้องถูก reject
- Multi-tab abuse ต้องถูกตรวจจับ

## 📊 Success Metrics

- **Rate Limit Effectiveness**: >95% spam blocked
- **Bypass Prevention**: 100% bypass attempts blocked
- **Input Validation**: >95% invalid inputs rejected
- **System Stability**: <10% performance degradation during attacks
