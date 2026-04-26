import "dotenv/config";
import db from "../db/db.js";
import { moodFromLabel } from "../services/moodEngine.js";

// Custom VAD presets for Ara personalities
const CUSTOM_PRESETS = {
  "low simmering warmth with dry sarcasm": { valence: 0.2, arousal: 0.1, dominance: 0.4 },
  "sharp, teasing, a little dangerous": { valence: 0.2, arousal: 0.3, dominance: 0.8 },
};

const personalities = db.prepare("SELECT id, name, mood, moodBaseline, moodState FROM personalities").all();

console.log("=== Fixing VAD Baselines ===\n");

let fixedCount = 0;

for (const p of personalities) {
  const baseline = JSON.parse(p.moodBaseline || "{}");
  const state = JSON.parse(p.moodState || "{}");
  
  // Check if baseline is all zeros or missing valence
  const isZeroBaseline = (!baseline.valence && !baseline.arousal && !baseline.dominance) || !("valence" in baseline);
  
  if (isZeroBaseline && p.mood) {
    console.log(`Fixing: ${p.name} (ID: ${p.id})`);
    console.log(`  Current mood label: ${p.mood}`);
    console.log(`  Current baseline: ${JSON.stringify(baseline)}`);
    
    // Check for custom preset first
    const moodKey = p.mood.toLowerCase().trim();
    let newBaseline = CUSTOM_PRESETS[moodKey];
    
    // Fall back to moodFromLabel if no custom preset
    if (!newBaseline) {
      newBaseline = moodFromLabel(p.mood);
    }
    
    console.log(`  New baseline: ${JSON.stringify(newBaseline)}`);
    
    // Update database
    db.prepare("UPDATE personalities SET moodBaseline = ?, moodState = ? WHERE id = ?").run(
      JSON.stringify(newBaseline),
      JSON.stringify(newBaseline),
      p.id
    );
    
    fixedCount++;
    console.log(`  ✓ Updated\n`);
  } else if (!isZeroBaseline) {
    console.log(`Skipping: ${p.name} (ID: ${p.id}) - already has valid baseline\n`);
  } else {
    console.log(`Skipping: ${p.name} (ID: ${p.id}) - no mood label\n`);
  }
}

console.log(`\n=== Fixed ${fixedCount} personalities ===`);
