/**
 * GanSystems ESP32 Firmware - Local HTTP Version
 * 
 * This version connects to your local development server via HTTP
 * Much simpler and more reliable for development/testing
 * 
 * SETUP:
 * 1. Get your laptop's IP: ip addr show | grep "inet " | grep -v 127.0.0.1
 * 2. Update SERVER_URL below with your laptop's IP
 * 3. Make sure ESP32 and laptop are on the same WiFi network
 * 4. Run: npm run dev (on your laptop)
 * 5. Upload this code to ESP32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* WIFI_SSID = "MTN_4G_B1583C";
const char* WIFI_PASSWORD = "4E0CB315";

// Server configuration - UPDATE THIS WITH YOUR LAPTOP'S IP!
// Example: "http://192.168.43.100:3000/api/device/sync"
const char* SERVER_URL = "http://192.168.43.100:3000/api/device/sync";
const char* DEVICE_ID = "ESP32-CONTROLLER";
const char* DEVICE_KEY = "N3GGKSldVHv68-2Vr5M_vpld9xowwjNe";
const char* FIRMWARE_VERSION = "1.0.0";

// Channel keys
const char* TANK_CHANNEL_KEY = "tank_main";
const char* PUMP_CHANNEL_KEY = "pump_main";
const char* PUMP_CHANNEL_ID = "";

// Hardware pins
const uint8_t TRIG_PIN = 5;
const uint8_t ECHO_PIN = 18;
const uint8_t PUMP_RELAY_PIN = 26;
const bool RELAY_ACTIVE_LOW = true;

// Tank calibration
const float TANK_EMPTY_DISTANCE_CM = 160.0f;
const float TANK_FULL_DISTANCE_CM = 20.0f;

// Timing
uint32_t syncIntervalMs = 30000;
uint32_t lastSyncMs = 0;
bool pumpState = false;

// Acknowledgement queue
struct AckItem {
  bool used = false;
  String commandId;
  String status;
  String message;
};
AckItem ackQueue[4];

float clampf(float value, float low, float high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

void setPump(bool on) {
  digitalWrite(PUMP_RELAY_PIN, RELAY_ACTIVE_LOW ? !on : on);
  pumpState = on;
}

void queueAck(const String& commandId, const String& status, const String& message) {
  for (int i = 0; i < 4; i++) {
    if (!ackQueue[i].used) {
      ackQueue[i].used = true;
      ackQueue[i].commandId = commandId;
      ackQueue[i].status = status;
      ackQueue[i].message = message;
      return;
    }
  }
  Serial.println("Ack queue full, dropping acknowledgement.");
}

void clearAckQueue() {
  for (int i = 0; i < 4; i++) {
    ackQueue[i].used = false;
    ackQueue[i].commandId = "";
    ackQueue[i].status = "";
    ackQueue[i].message = "";
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  
  uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n=== WiFi Connected ===");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("DNS: ");
    Serial.println(WiFi.dnsIP());
    Serial.println("=====================\n");
  } else {
    Serial.println("WiFi connection failed!");
  }
}

float readTankDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration <= 0) return -1.0f;
  
  return (duration * 0.0343f) / 2.0f;
}

float readTankPercent(float distanceCm) {
  if (distanceCm < 0) return -1.0f;
  
  float percent = 100.0f * (TANK_EMPTY_DISTANCE_CM - distanceCm) / 
                  (TANK_EMPTY_DISTANCE_CM - TANK_FULL_DISTANCE_CM);
  return clampf(percent, 0.0f, 100.0f);
}

bool commandTargetsPump(JsonObject cmd) {
  const char* channelKey = cmd["channelKey"] | "";
  if (strlen(channelKey) > 0 && String(channelKey) == PUMP_CHANNEL_KEY) return true;
  
  const char* channelId = cmd["channelId"] | "";
  if (strlen(PUMP_CHANNEL_ID) > 0 && String(channelId) == PUMP_CHANNEL_ID) return true;
  
  return false;
}

void processPendingCommands(JsonArray commands) {
  for (JsonObject cmd : commands) {
    const char* commandId = cmd["commandId"] | "";
    const char* channelId = cmd["channelId"] | "";
    const char* commandType = cmd["commandType"] | "";
    
    if (!commandTargetsPump(cmd)) {
      Serial.printf("Unmapped command: id=%s channelId=%s type=%s\n", 
                    commandId, channelId, commandType);
      continue;
    }
    
    if (cmd["desiredBooleanState"].isNull()) {
      queueAck(commandId, "failed", "desiredBooleanState missing");
      continue;
    }
    
    bool nextState = cmd["desiredBooleanState"].as<bool>();
    setPump(nextState);
    queueAck(commandId, "acknowledged", nextState ? "Pump turned on" : "Pump turned off");
    Serial.printf("✓ Pump command applied: %s\n", nextState ? "ON" : "OFF");
  }
}

void syncDevice() {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected, skipping sync");
    return;
  }
  
  // Read sensor data
  float distanceCm = readTankDistanceCm();
  float tankPercent = readTankPercent(distanceCm);
  
  // Build request payload
  DynamicJsonDocument requestDoc(1024);
  requestDoc["firmwareVersion"] = FIRMWARE_VERSION;
  
  JsonArray readings = requestDoc.createNestedArray("readings");
  
  // Tank reading
  JsonObject tank = readings.createNestedObject();
  tank["channelKey"] = TANK_CHANNEL_KEY;
  if (tankPercent >= 0) {
    tank["numericValue"] = tankPercent;
    tank["rawValue"] = distanceCm;
    tank["rawUnit"] = "cm";
    tank["status"] = "ok";
  } else {
    tank["status"] = "fault";
  }
  
  // Pump reading
  JsonObject pump = readings.createNestedObject();
  pump["channelKey"] = PUMP_CHANNEL_KEY;
  pump["booleanState"] = pumpState;
  pump["numericValue"] = pumpState ? 1 : 0;
  pump["status"] = "ok";
  
  // Acknowledgements
  JsonArray acknowledgements = requestDoc.createNestedArray("acknowledgements");
  for (int i = 0; i < 4; i++) {
    if (!ackQueue[i].used) continue;
    JsonObject ack = acknowledgements.createNestedObject();
    ack["commandId"] = ackQueue[i].commandId;
    ack["status"] = ackQueue[i].status;
    ack["deviceMessage"] = ackQueue[i].message;
  }
  
  String body;
  serializeJson(requestDoc, body);
  
  HTTPClient http;
  
  Serial.println("\n========== SYNC START ==========");
  Serial.printf("Time: %lu ms\n", millis());
  Serial.printf("URL: %s\n", SERVER_URL);
  Serial.printf("Tank: %.1f%% (%.1f cm)\n", tankPercent, distanceCm);
  Serial.printf("Pump: %s\n", pumpState ? "ON" : "OFF");
  
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-device-key", DEVICE_KEY);
  http.setConnectTimeout(8000);
  http.setTimeout(10000);
  
  int statusCode = http.POST(body);
  String response = http.getString();
  
  Serial.printf("\nHTTP Status: %d\n", statusCode);
  
  if (statusCode <= 0) {
    Serial.printf("✗ HTTP Error: %s\n", http.errorToString(statusCode).c_str());
    Serial.println("========== SYNC FAILED ==========\n");
    http.end();
    return;
  }
  
  if (statusCode >= 200 && statusCode < 300) {
    Serial.println("✓ Sync successful!");
    
    // Clear acknowledgement queue
    clearAckQueue();
    
    // Parse response
    DynamicJsonDocument responseDoc(4096);
    DeserializationError err = deserializeJson(responseDoc, response);
    if (err) {
      Serial.print("✗ Response parse failed: ");
      Serial.println(err.c_str());
    } else {
      // Update sync interval
      int heartbeatSec = responseDoc["controller"]["heartbeatIntervalSec"] | 60;
      syncIntervalMs = (heartbeatSec > 5 ? (heartbeatSec - 5) * 1000UL : 5000UL);
      if (syncIntervalMs < 5000UL) syncIntervalMs = 5000UL;
      Serial.printf("Next sync: %lu ms\n", syncIntervalMs);
      
      // Process pending commands
      JsonArray pendingCommands = responseDoc["pendingCommands"].as<JsonArray>();
      if (pendingCommands.size() > 0) {
        Serial.printf("Processing %d command(s)...\n", pendingCommands.size());
        processPendingCommands(pendingCommands);
      }
    }
  } else {
    Serial.printf("✗ Server error: %d\n", statusCode);
    Serial.println("Response:");
    Serial.println(response);
  }
  
  Serial.println("========== SYNC END ==========\n");
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║   GanSystems ESP32 Controller     ║");
  Serial.println("║   Firmware v1.0.0                  ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.println();
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  
  setPump(false);
  Serial.println("✓ Hardware initialized");
  
  connectWiFi();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Performing initial sync...");
    syncDevice();
  }
  
  lastSyncMs = millis();
}

void loop() {
  if (millis() - lastSyncMs >= syncIntervalMs) {
    lastSyncMs = millis();
    syncDevice();
  }
  
  // Add a small delay to prevent watchdog issues
  delay(10);
}
