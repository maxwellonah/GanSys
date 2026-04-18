/**
 * GanSystems ESP32 Firmware - Vercel Compatible
 * 
 * This version includes proper SSL/TLS certificate handling for Vercel
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* WIFI_SSID = "MTN_4G_B1583C";
const char* WIFI_PASSWORD = "4E0CB315";

// Server configuration
const char* SERVER_HOST = "gansystems.vercel.app";
const char* SERVER_URL = "https://gansystems.vercel.app/api/device/sync";
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

// Root CA certificate for Vercel (Let's Encrypt)
// This certificate is valid until 2035
const char* rootCACertificate = \
"-----BEGIN CERTIFICATE-----\n" \
"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\n" \
"-----END CERTIFICATE-----\n";

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
    Serial.print("WiFi connected. ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
  } else {
    Serial.println("WiFi connection failed.");
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
    Serial.printf("Pump command applied: %s\n", nextState ? "ON" : "OFF");
  }
}

void syncDevice() {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;
  
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
  
  // Create secure WiFi client with certificate
  WiFiClientSecure *client = new WiFiClientSecure;
  if (!client) {
    Serial.println("Unable to create client");
    return;
  }
  
  // Set root CA certificate
  client->setCACert(rootCACertificate);
  
  // Create HTTP client
  HTTPClient https;
  
  Serial.println("----- Sync Start -----");
  Serial.printf("ESP32 IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Gateway: %s\n", WiFi.gatewayIP().toString().c_str());
  Serial.printf("POST URL: %s\n", SERVER_URL);
  Serial.printf("Payload: %s\n", body.c_str());
  
  // Begin HTTPS connection
  if (https.begin(*client, SERVER_URL)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("x-device-id", DEVICE_ID);
    https.addHeader("x-device-key", DEVICE_KEY);
    https.setConnectTimeout(10000);
    https.setTimeout(15000);
    
    int statusCode = https.POST(body);
    String response = https.getString();
    
    Serial.printf("HTTP %d\n", statusCode);
    if (statusCode <= 0) {
      Serial.printf("HTTP error: %s\n", https.errorToString(statusCode).c_str());
    }
    Serial.println("Response:");
    Serial.println(response);
    
    https.end();
    
    if (statusCode < 200 || statusCode >= 300) {
      Serial.println("Sync failed.");
      delete client;
      return;
    }
    
    // Clear acknowledgement queue
    clearAckQueue();
    
    // Parse response
    DynamicJsonDocument responseDoc(4096);
    DeserializationError err = deserializeJson(responseDoc, response);
    if (err) {
      Serial.print("Response parse failed: ");
      Serial.println(err.c_str());
      delete client;
      return;
    }
    
    // Update sync interval
    int heartbeatSec = responseDoc["controller"]["heartbeatIntervalSec"] | 60;
    syncIntervalMs = (heartbeatSec > 5 ? (heartbeatSec - 5) * 1000UL : 5000UL);
    if (syncIntervalMs < 5000UL) syncIntervalMs = 5000UL;
    Serial.printf("Next sync in %lu ms\n", syncIntervalMs);
    
    // Process pending commands
    JsonArray pendingCommands = responseDoc["pendingCommands"].as<JsonArray>();
    processPendingCommands(pendingCommands);
    
    Serial.println("----- Sync End -----");
  } else {
    Serial.println("Unable to connect to server");
  }
  
  delete client;
}

void setup() {
  Serial.begin(115200);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  
  setPump(false);
  
  connectWiFi();
  syncDevice();
  lastSyncMs = millis();
}

void loop() {
  if (millis() - lastSyncMs >= syncIntervalMs) {
    lastSyncMs = millis();
    syncDevice();
  }
}
