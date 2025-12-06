require('dotenv').config();
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const fs = require('fs');

async function testVoice() {
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

  // Test with Sound Effects API - include "saying" in the prompt
  const prompt = 'Deep sinister male voice saying "COWARD! You cannot escape!" with evil glee, demonic announcer, heavy reverb echo';

  console.log('Generating with prompt:', prompt);

  const response = await client.textToSoundEffects.convert({
    text: prompt,
    durationSeconds: 2.0,
    promptInfluence: 0.3,
  });

  const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  fs.writeFileSync('/tmp/test_voice.mp3', buffer);
  console.log('Saved to /tmp/test_voice.mp3');
  console.log('Size:', buffer.length, 'bytes');
}

testVoice().catch(console.error);
