const fs = require("node:fs");
const path = require("node:path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");

if (!fs.existsSync(serverPath)) {
  console.error("Standalone build not found. Run `npm run build` before `npm start`.");
  process.exit(1);
}

require(serverPath);
