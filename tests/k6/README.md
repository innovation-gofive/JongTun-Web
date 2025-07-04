# 📊 K6 Load Testing Scripts

Scripts สำหรับการทดสอบ performance และ load ด้วย K6

## 📋 Scripts ในโฟลเดอร์นี้

### `k6-load-test.js`

- **จุดประสงค์**: ทดสอบ load พื้นฐานของระบบ
- **การใช้งาน**: `k6 run k6-load-test.js`
- **เป้าหมาย**: จำลอง user behavior ปกติ

### `k6-spam-test.js`

- **จุดประสงค์**: ทดสอบการป้องกัน spam
- **การใช้งาน**: `k6 run k6-spam-test.js`
- **เป้าหมาย**: ทดสอบ rate limiting และ spam protection

### `k6-red-team-attacks.js`

- **จุดประสงค์**: ทดสอบ security attacks แบบครอบคลุม
- **การใช้งาน**: `k6 run k6-red-team-attacks.js`
- **เป้าหมาย**: จำลอง Red Team attacks หลายรูปแบบ

## 🚀 การรัน Tests

### ทดสอบแบบ Individual

```bash
# Load testing
k6 run k6-load-test.js

# Spam testing
k6 run k6-spam-test.js

# Red Team attacks
k6 run k6-red-team-attacks.js
```

### ทดสอบด้วย Parameters

```bash
# กำหนด target URL
k6 run --env BASE_URL=http://localhost:3000 k6-red-team-attacks.js

# กำหนด scenario เฉพาะ
k6 run --scenario load_attack k6-red-team-attacks.js
```

## 📈 Metrics ที่ตรวจสอบ

- **http_req_duration** - Response time
- **http_req_failed** - Error rate
- **rate_limit_hits** - จำนวนครั้งที่โดน rate limit
- **security_blocks** - จำนวนครั้งที่ถูก security block
- **bypass_attempts** - ความพยายาม bypass

## 🎯 Success Criteria

- Response time < 5 วินาที (95th percentile)
- Error rate < 50% (เนื่องจากมีการโจมตีในการทดสอบ)
- Rate limiting ทำงาน (มี rate_limit_hits > 0)
- Security blocking ทำงาน (มี security_blocks > 0)
