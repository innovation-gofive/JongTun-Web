# 🤖 Testing Automation Scripts

Scripts สำหรับ automate การทดสอบต่าง ๆ

## 📋 Scripts ในโฟลเดอร์นี้

### `red-team-testing.ps1` (PowerShell)

- **จุดประสงค์**: Interactive Red Team testing suite
- **ระบบ**: Windows PowerShell
- **ฟีเจอร์**:
  - เมนูแบบ interactive
  - รัน K6 tests
  - เปิด browser attack console
  - สร้าง attack reports

### `run-tests.ps1` (PowerShell)

- **จุดประสงค์**: ทดสอบพื้นฐานสำหรับ development
- **ระบบ**: Windows PowerShell
- **ฟีเจอร์**: รัน tests ทั่วไป

### `run-tests.sh` (Bash)

- **จุดประสงค์**: ทดสอบพื้นฐานสำหรับ Unix/Linux
- **ระบบ**: Bash
- **ฟีเจอร์**: รัน tests ทั่วไป

## 🚀 การใช้งาน

### Red Team Testing Suite (Recommended)

```powershell
# เปิด PowerShell และรัน
.\red-team-testing.ps1

# เลือกจากเมนู:
# 1. รัน K6 Load Testing
# 2. รัน Browser Attack Console
# 3. รัน API Security Testing
# 4. สร้าง Attack Report
```

### Basic Testing

```powershell
# Windows
.\run-tests.ps1

# Linux/Mac
./run-tests.sh
```

## 🎯 Red Team Testing Menu

เมนูใน `red-team-testing.ps1`:

1. **🚀 K6 Load Testing (All Scenarios)** - รัน comprehensive load testing
2. **📈 K6 Load Attack Only** - รัน load attack เท่านั้น
3. **🌊 K6 API Spam Test** - ทดสอบ API spam protection
4. **🚪 K6 Queue Bypass Test** - ทดสอบ queue bypass protection
5. **⏱️ K6 Rate Limit Test** - ทดสอบ rate limiting
6. **🌐 Browser Attack Console** - เปิด browser-based attack console
7. **🔌 API Security Testing** - ทดสอบ API security ด้วย PowerShell
8. **📊 Generate Attack Report** - สร้างรายงานผลการทดสอบ
9. **🎯 Open Target Application** - เปิดแอพพลิเคชันเป้าหมาย

## 🔧 Prerequisites

### สำหรับ PowerShell Scripts:

- Windows PowerShell 5.1+ หรือ PowerShell Core 7+
- K6 installed (`winget install k6`)
- Node.js (สำหรับรัน application)
- Web browser (Edge/Chrome)

### สำหรับ Bash Scripts:

- Bash shell
- K6 installed
- Node.js
- curl (สำหรับ API testing)

## 📊 Output และ Reports

Scripts จะสร้าง:

- **Console logs** - แสดงผลการทดสอบแบบ real-time
- **Attack reports** - ไฟล์ markdown สรุปผลการทดสอบ
- **Test artifacts** - ไฟล์ HTML สำหรับ browser testing

## ⚠️ ข้อควรระวัง

- รัน tests ในสิ่งแวดล้อมทดสอบเท่านั้น
- ไม่ใช้กับ production systems
- ตรวจสอบว่า application กำลังรันอยู่ก่อนทดสอบ
- Monitor system resources ระหว่างการทดสอบ
