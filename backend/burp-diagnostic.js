/**
 * Burp SFX Diagnostic Script
 * Tests the [BURP] marker flow from speechDirector through ttsService
 */

import { buildSpeechPacket } from "./services/speechDirector.js";
import { prepareSpeechSynthesis, generateSpeechAudio } from "./services/ttsService.js";

// Mock Rick personality
const rickPersonality = {
  id: 999,
  name: "Rick Sanchez",
  traits: ["genius", "nihilistic", "chaotic", "sarcastic"],
  speechStyle: {
    vocabulary: "advanced",
    formality: "low",
    tone: "sardonic",
    humor: "cynical",
  },
  behaviorRules: ["burp randomly"],
  expressionStyle: { rules: [], sentenceStyle: "fragments", energy: "high" },
  creativeContext: "default",
  moodBaseline: "irritable",
};

// Mock generic personality (no burp)
const normalPersonality = {
  id: 888,
  name: "Assistant",
  traits: ["helpful", "analytical"],
  speechStyle: {
    vocabulary: "standard",
    formality: "medium",
    tone: "neutral",
  },
  behaviorRules: [],
  expressionStyle: { rules: [], sentenceStyle: "complete", energy: "medium" },
  creativeContext: "default",
  moodBaseline: "neutral",
};

console.log("=".repeat(70));
console.log("BURP SFX FLOW DIAGNOSTIC");
console.log("=".repeat(70));

// Test 1: buildSpeechPacket for Rick
console.log("\n--- TEST 1: buildSpeechPacket for Rick personality ---");
const rickText = "Morty, I need you to listen carefully!";
const rickPacket = buildSpeechPacket(rickText, rickPersonality, null, {
  styleMode: "performance",
  channel: "tts",
});

console.log("Input text:", rickText);
console.log("Output speech:", rickPacket.speech);
console.log("Has [BURP] marker:", rickPacket.speech.includes("[BURP]"));
console.log("SFX array (buildSpeechPacket):", rickPacket.sfx);

// Test 2: buildSpeechPacket for normal personality
console.log("\n--- TEST 2: buildSpeechPacket for normal personality ---");
const normalPacket = buildSpeechPacket(rickText, normalPersonality, null, {
  styleMode: "performance",
  channel: "tts",
});

console.log("Output speech:", normalPacket.speech);
console.log("Has [BURP] marker:", normalPacket.speech.includes("[BURP]"));
console.log("SFX array (buildSpeechPacket):", normalPacket.sfx);

// Test 3: prepareSpeechSynthesis extracts BURP
console.log("\n--- TEST 3: prepareSpeechSynthesis extraction ---");
const prepareResult = prepareSpeechSynthesis({
  personality: rickPersonality,
  text: rickPacket.speech,  // This has [BURP] prepended
  voiceProfile: { engine: "auto" },
});

console.log("Input to prepareSpeechSynthesis:", rickPacket.speech);
console.log("Directed text (after extraction):", prepareResult.directedText);
console.log("SFX array (prepareSpeechSynthesis):", prepareResult.sfx);
console.log("Speech packet from prepare:", prepareResult.speechPacket?.speech);

// Test 4: Multiple burps in text
console.log("\n--- TEST 4: Multiple [BURP] markers ---");
const multiBurpText = "[BURP] Listen Morty! [BURP] You need to understand!";
const multiPrepare = prepareSpeechSynthesis({
  personality: rickPersonality,
  text: multiBurpText,
  voiceProfile: { engine: "auto" },
});
console.log("Input:", multiBurpText);
console.log("Directed text:", multiPrepare.directedText);
console.log("SFX array:", multiPrepare.sfx);

// Test 5: Force consistent RNG for shouldInject test
console.log("\n--- TEST 5: Statistical BURP injection rate ---");
let burpCount = 0;
const trials = 100;
for (let i = 0; i < trials; i++) {
  const testText = `Test message ${i}`;
  const packet = buildSpeechPacket(testText, rickPersonality, null, {
    styleMode: "performance",
    channel: "tts",
  });
  if (packet.speech.includes("[BURP]")) {
    burpCount++;
  }
}
console.log(`Burp injection rate: ${burpCount}/${trials} (${(burpCount/trials*100).toFixed(1)}%)`);
console.log("Expected rate: ~28% (shouldInject probability in speechDirector)");

console.log("\n" + "=".repeat(70));
console.log("DIAGNOSTIC COMPLETE");
console.log("=");
console.log("If SFX array is populated but no burp plays:");
console.log("1. Check if frontend is reading X-Voxis-Tts-Sfx header");
console.log("2. Check if /api/sfx/audio/burp endpoint is cached");
console.log("3. Check browser console for SFX fetch errors");
console.log("=".repeat(70));