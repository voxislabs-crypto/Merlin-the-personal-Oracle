import Database from "better-sqlite3";

const db = new Database("voxis.sqlite");

console.log("=== PERSONALITIES ===");
const personalities = db.prepare("SELECT * FROM personalities").all();
console.log(`Found ${personalities.length} personalities:`);
personalities.forEach(p => {
  console.log(`- ID: ${p.id}, Name: ${p.name}, Description: ${p.description.substring(0, 100)}...`);
});

console.log("\n=== CHAT MESSAGES ===");
const messages = db.prepare("SELECT COUNT(*) as count FROM chat_messages").get();
console.log(`Total chat messages: ${messages.count}`);

console.log("\n=== ATTACHMENTS ===");
const attachments = db.prepare("SELECT COUNT(*) as count FROM chat_attachments").get();
console.log(`Total attachments: ${attachments.count}`);

db.close();
