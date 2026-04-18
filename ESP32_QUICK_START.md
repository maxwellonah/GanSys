# ESP32 Quick Start Guide

## The Problem
Your ESP32 can't connect to Vercel because:
- Mobile hotspots often block HTTPS from IoT devices
- Vercel's edge network may reject ESP32 connections
- SSL/TLS handshake issues

## The Solution: Use Local HTTP Server

### Step 1: Get Your Laptop's IP Address

Your laptop's current IP: **10.33.68.202**

To verify or get updated IP:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Step 2: Start Local Development Server

```bash
cd ~/Downloads/GanSys
npm run dev
```

The server will start on `http://localhost:3000`

### Step 3: Update ESP32 Code

Open `esp32-firmware-local.ino` and update line 23:

```cpp
const char* SERVER_URL = "http://10.33.68.202:3000/api/device/sync";
```

### Step 4: Upload to ESP32

1. Open Arduino IDE
2. Load `esp32-firmware-local.ino`
3. Select your ESP32 board and port
4. Click Upload
5. Open Serial Monitor (115200 baud)

### Step 5: Watch It Work!

You should see:
```
╔════════════════════════════════════╗
║   GanSystems ESP32 Controller     ║
║   Firmware v1.0.0                  ║
╚════════════════════════════════════╝

✓ Hardware initialized
=== WiFi Connected ===
ESP32 IP: 192.168.43.xxx
Gateway: 192.168.43.1
=====================

========== SYNC START ==========
URL: http://10.33.68.202:3000/api/device/sync
Tank: 92.6% (30.3 cm)
Pump: OFF

HTTP Status: 200
✓ Sync successful!
Next sync: 25000 ms
========== SYNC END ==========
```

## Troubleshooting

### ESP32 can't connect to laptop

**Problem:** HTTP error: connection refused

**Solutions:**
1. Make sure ESP32 and laptop are on the SAME WiFi network
2. Check if dev server is running: `curl http://localhost:3000/api/health`
3. Check firewall: `sudo ufw allow 3000` (if using ufw)
4. Try laptop's other IP if you have multiple network interfaces

### WiFi connection fails

**Problem:** WiFi connection failed!

**Solutions:**
1. Double-check WiFi credentials in code
2. Make sure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router

### DNS issues

**Problem:** Can't resolve hostname

**Solution:** Use IP address instead of hostname (already done in local version)

## Testing the Endpoint

From your laptop, test if the endpoint works:

```bash
curl -X POST http://localhost:3000/api/device/sync \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32-CONTROLLER" \
  -H "x-device-key: N3GGKSldVHv68-2Vr5M_vpld9xowwjNe" \
  -d '{
    "firmwareVersion": "1.0.0",
    "readings": [
      {
        "channelKey": "tank_main",
        "numericValue": 75.5,
        "rawValue": 45.2,
        "rawUnit": "cm",
        "status": "ok"
      }
    ]
  }'
```

You should get a JSON response with controller info and pending commands.

## Next Steps

Once working locally:
1. Test pump control from the dashboard
2. Monitor real-time data updates
3. For production, consider:
   - Railway.app (better for IoT)
   - Render.com
   - DigitalOcean App Platform
   - Or keep using local server with port forwarding

## Production Deployment (Alternative to Vercel)

If you need remote access, use **Railway** instead of Vercel:

1. Sign up at railway.app
2. Connect your GitHub repo
3. Deploy (Railway handles everything)
4. Get your Railway URL (e.g., `https://your-app.railway.app`)
5. Update ESP32 code with Railway URL
6. Railway is IoT-friendly and supports WebSockets/MQTT

Railway works much better with ESP32 than Vercel!
