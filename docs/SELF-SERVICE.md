# Queue Management System - Self-Service Mode

## 🎯 System Overview

This is a **Self-Service Queue Management System** that operates fully automatically without requiring admin intervention. Users can join the queue and will be processed automatically by the system.

## 🚀 Key Features

### ✅ **Self-Service Operation**

- **No Admin Required**: System processes queue automatically
- **24/7 Operation**: Works around the clock
- **Auto-Processing**: Users are moved forward every 30 seconds
- **Real-time Updates**: Queue status updates every 5 seconds

### ✅ **User Experience**

- **Simple Flow**: Join → Wait → Automatic Processing → Proceed
- **Transparent**: Users see their position and estimated wait time
- **Responsive**: Works on all devices
- **Modern UI**: Glass morphism design with smooth animations

### ✅ **Technical Features**

- **Type-Safe**: Full TypeScript implementation
- **Error Handling**: Circuit breakers, retries, fallback systems
- **Security**: CSRF protection, input validation, rate limiting
- **Monitoring**: Real-time system monitoring and logging
- **State Management**: Zustand stores for reliable state handling

## 🔧 Configuration

### Auto-Processing Settings

```typescript
// Default configuration in auto-queue-processor.ts
{
  enabled: true,
  processingInterval: 30000,    // 30 seconds
  batchSize: 5,                 // 5 users per batch
  maxConcurrentUsers: 20,       // Max 20 users allowed simultaneously
  businessHours: {
    enabled: false,             // 24/7 operation
    start: "09:00",
    end: "17:00",
    timezone: "Asia/Bangkok"
  }
}
```

### Environment Variables

```bash
# Optional - for future enhancements
ENABLE_BUSINESS_HOURS=false
MAX_CONCURRENT_USERS=20
PROCESSING_INTERVAL=30000
BATCH_SIZE=5
```

## 📊 API Endpoints

### User Endpoints

- `POST /api/queue/join` - Join the queue
- `GET /api/queue/status` - Check queue status

### Monitoring Endpoint (Read-only)

- `GET /api/queue/monitor` - System monitoring and statistics

### Removed Endpoints

- ❌ `POST /api/queue/admin` - No longer needed (admin panel removed)

## 🏗️ Architecture

### Auto-Processing Flow

```
User Joins Queue → Auto-Processor (every 30s) → Users Allowed → Continue to Service
```

### System Components

1. **Queue Store** (Zustand) - Client-side state management
2. **Auto-Processor** - Server-side automatic queue processing
3. **API Routes** - Backend queue operations
4. **UI Components** - React components with real-time updates

## 🔄 Changes Made

### Removed Components

- ✅ `public/admin.html` - Admin panel removed
- ✅ `src/app/api/queue/admin/route.ts` - Admin API removed

### Added Components

- ✅ `src/lib/auto-queue-processor.ts` - Automatic queue processing
- ✅ `src/app/api/queue/monitor/route.ts` - Read-only monitoring

### Modified Components

- ✅ `src/lib/queue-utils.ts` - Added cleanup functions
- ✅ `src/app/api/queue/join/route.ts` - Auto-starts processor
- ✅ `src/app/waiting-room/components/WaitingRoom.tsx` - Self-service messaging
- ✅ `src/app/page.tsx` - Self-service status indicator

## 📈 Monitoring

### Queue Statistics

```typescript
// Available at GET /api/queue/monitor
{
  queue: {
    totalInQueue: number,
    allowedUsers: number,
    estimatedWaitMinutes: number,
    nextProcessingIn: number
  },
  autoProcessor: {
    isRunning: boolean,
    mode: "self-service",
    processing: { ... },
    businessHours: { ... }
  },
  systemHealth: {
    status: "healthy",
    adminRequired: false
  }
}
```

### Real-time Monitoring

- System automatically logs all queue operations
- Circuit breakers monitor system health
- Fallback systems ensure reliability
- Error tracking and recovery

## 🔧 Development

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Run Tests

```bash
npm run lint
```

## 🚦 System Status

- ✅ **Self-Service Mode**: Active
- ✅ **Auto-Processing**: Enabled
- ✅ **Admin Panel**: Removed (not needed)
- ✅ **24/7 Operation**: Available
- ✅ **Real-time Updates**: Working
- ✅ **Error Handling**: Comprehensive
- ✅ **Security**: Implemented
- ✅ **Monitoring**: Available

## 🎯 User Journey

1. **Landing Page**: User sees "Self-Service Mode Active" status
2. **Join Queue**: Click button to join queue automatically
3. **Waiting Room**: See position, estimated wait time, auto-processing status
4. **Auto-Processing**: System automatically processes queue every 30 seconds
5. **Branch Selection**: User proceeds to select branch
6. **Product Selection**: User proceeds to select product
7. **Confirmation**: User confirms reservation
8. **Complete**: Process finished

## 🔮 Future Enhancements

### Possible Additions (Optional)

- **Analytics Dashboard**: Advanced queue analytics
- **Notification System**: SMS/Email notifications
- **Appointment Scheduling**: Pre-booking capabilities
- **Multi-location Support**: Multiple branch queues
- **Priority Queue**: VIP user support
- **Load Balancing**: Auto-scaling based on demand

### Note

The current system is designed for simplicity and reliability. All core functionality works without admin intervention, making it perfect for self-service operations.
