const fs = require("node:fs");
const path = require("node:path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const projectRoot = path.join(__dirname, "..");
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");
const sourceStaticPath = path.join(projectRoot, ".next", "static");
const targetStaticPath = path.join(standaloneRoot, ".next", "static");

if (!fs.existsSync(serverPath)) {
  console.error("Standalone build not found. Run `npm run build` before `npm start`.");
  process.exit(1);
}

// Next standalone output does not include .next/static by default.
// Mirror the build assets into the standalone runtime so CSS and JS are served correctly.
if (fs.existsSync(sourceStaticPath)) {
  fs.mkdirSync(path.dirname(targetStaticPath), { recursive: true });
  fs.cpSync(sourceStaticPath, targetStaticPath, { recursive: true, force: true });
}

require(serverPath);
