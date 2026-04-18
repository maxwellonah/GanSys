# ESP32 Connection Troubleshooting

## Problem: "Connection Refused" Error

The ESP32 is getting "connection refused" when trying to connect to Vercel. This is typically caused by:

### 1. Network/Firewall Issues
- Mobile hotspots often block outgoing HTTPS connections from IoT devices
- Some ISPs block non-browser HTTPS traffic
- Corporate/school networks may have restrictions

### 2. DNS Resolution Issues
- The ESP32 might not be able to resolve `gansystems.vercel.app`
- Try using the IP address directly (not recommended for production)

### 3. SSL/TLS Issues
- The ESP32's SSL library might not support Vercel's certificates
- Memory constraints on ESP32 can cause SSL handshake failures

## Solutions

### Solution 1: Test with Local Server (Recommended for Development)

Instead of connecting to Vercel, run the server locally and connect the ESP32 to your local network:

1. **Get your laptop's local IP:**
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Update ESP32 code to use local server:**
   ```cpp
   const char* SERVER_URL = "http://YOUR_LAPTOP_IP:3000/api/device/sync";
   ```
   Example: `http://192.168.43.100:3000/api/device/sync`

4. **Remove HTTPS code** - use regular HTTPClient without WiFiClientSecure

### Solution 2: Use ngrok Tunnel (For Testing with HTTPS)

If you need to test with HTTPS but Vercel isn't working:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start local server:**
   ```bash
   npm run dev
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Use the ngrok HTTPS URL in ESP32:**
   ```cpp
   const char* SERVER_URL = "https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/device/sync";
   ```

### Solution 3: Debug Network Connectivity

Add this debug code to your ESP32 to test basic connectivity:

```cpp
void testConnectivity() {
  Serial.println("Testing DNS resolution...");
  IPAddress serverIP;
  if (WiFi.hostByName("gansystems.vercel.app", serverIP)) {
    Serial.print("Resolved to: ");
    Serial.println(serverIP);
  } else {
    Serial.println("DNS resolution failed!");
  }
  
  Serial.println("Testing HTTP connection to google.com...");
  HTTPClient http;
  http.begin("http://www.google.com");
  int code = http.GET();
  Serial.printf("Google HTTP response: %d\n", code);
  http.end();
  
  Serial.println("Testing HTTPS connection to google.com...");
  WiFiClientSecure *client = new WiFiClientSecure;
  client->setInsecure(); // Skip certificate validation for testing
  HTTPClient https;
  if (https.begin(*client, "https://www.google.com")) {
    code = https.GET();
    Serial.printf("Google HTTPS response: %d\n", code);
    https.end();
  }
  delete client;
}
```

Call this in `setup()` after WiFi connects.

### Solution 4: Check Vercel Deployment

Make sure your Vercel deployment is actually working:

```bash
curl -X POST https://gansystems.vercel.app/api/device/sync \
  -H "Content-Type: application/json" \
  -H "x-device-id: ESP32-CONTROLLER" \
  -H "x-device-key: N3GGKSldVHv68-2Vr5M_vpld9xowwjNe" \
  -d '{"firmwareVersion":"1.0.0","readings":[{"channelKey":"tank_main","numericValue":50}]}'
```

If this works from your laptop but not from ESP32, it's a network/device issue.

## Recommended Approach for Development

**Use local HTTP server** - it's faster, easier to debug, and doesn't require SSL:

1. Run server locally: `npm run dev`
2. Connect ESP32 to same WiFi as laptop
3. Use HTTP (not HTTPS) to local IP
4. Once working locally, deploy to Vercel for production

## Production Deployment

For production with Vercel:
- Consider using a different hosting provider that's more IoT-friendly (Railway, Render, DigitalOcean)
- Or use Vercel with a reverse proxy that handles SSL termination
- Or use MQTT instead of HTTP for device communication
