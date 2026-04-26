import "dotenv/config";
import db from "../db/db.js";

const personalities = db.prepare("SELECT id, name, moodBaseline, moodState FROM personalities").all();

console.log("=== Personality Mood State Check ===\n");

for (const p of personalities) {
  console.log(`ID: ${p.id} | Name: ${p.name}`);
  console.log(`  moodBaseline: ${p.moodBaseline}`);
  console.log(`  moodState: ${p.moodState}`);
  
  const baseline = JSON.parse(p.moodBaseline || "{}");
  const state = JSON.parse(p.moodState || "{}");
  
  console.log(`  Parsed baseline:`, baseline);
  console.log(`  Parsed state:`, state);
  console.log(`  Has valence in baseline: ${"valence" in baseline}`);
  console.log(`  Has valence in state: ${"valence" in state}`);
  console.log("");
}
