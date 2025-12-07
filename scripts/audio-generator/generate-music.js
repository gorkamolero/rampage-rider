#!/usr/bin/env node

/**
 * ElevenLabs Music Generator for Rampage Rider
 *
 * Generates music tracks using the ElevenLabs Eleven Music API.
 * Uses the official @elevenlabs/elevenlabs-js SDK.
 *
 * Usage:
 *   # Test API connection
 *   node generate-music.js --test
 *
 *   # Generate all music tracks defined in music-definitions.json
 *   node generate-music.js
 *
 *   # Generate single track by ID
 *   node generate-music.js --id=christmas_theme
 *
 *   # Dry run (show what would be generated)
 *   node generate-music.js --dry-run
 *
 *   # Force regenerate existing files
 *   node generate-music.js --force
 *
 * Environment:
 *   ELEVENLABS_API_KEY - Your ElevenLabs API key
 *
 * Note: Eleven Music API requires a paid plan and has minimum 10 second duration.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch {
  // dotenv not installed
}

// Configuration
const CONFIG = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  outputDir: path.join(__dirname, '../../public/audio/music'),
  definitionsFile: path.join(__dirname, 'music-definitions.json'),
  delayBetweenRequests: 2000, // Music generation takes longer
  maxRetries: 3,
};

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value ?? true;
  }
  return acc;
}, {});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get or create ElevenLabs client
 */
let _client = null;
async function getClient() {
  if (_client) return _client;

  const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
  _client = new ElevenLabsClient({
    apiKey: CONFIG.apiKey,
  });
  return _client;
}

/**
 * Load music definitions from JSON file
 */
function loadDefinitions() {
  if (!fs.existsSync(CONFIG.definitionsFile)) {
    // Create default definitions if not exists
    const defaults = {
      meta: {
        version: '1.0.0',
        project: 'Rampage Rider',
        notes: 'Music tracks generated with ElevenLabs Eleven Music API'
      },
      tracks: [
        {
          id: 'christmas_theme_1',
          path: 'christmas_theme_1.mp3',
          prompt: 'Traditional Christmas market music, accordion and strings, festive German winter market atmosphere, cheerful waltz tempo, instrumental',
          duration: 60,
          instrumental: true
        },
        {
          id: 'christmas_theme_2',
          path: 'christmas_theme_2.mp3',
          prompt: 'Cozy Christmas carol, gentle piano and bells, warm holiday feeling, snowy winter evening mood, nostalgic and comforting, instrumental',
          duration: 60,
          instrumental: true
        },
        {
          id: 'christmas_theme_3',
          path: 'christmas_theme_3.mp3',
          prompt: 'Upbeat Christmas jazz, swing rhythm with sleigh bells, festive big band style, happy holiday shopping music, instrumental',
          duration: 60,
          instrumental: true
        }
      ]
    };
    fs.writeFileSync(CONFIG.definitionsFile, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  const content = fs.readFileSync(CONFIG.definitionsFile, 'utf-8');
  return JSON.parse(content);
}

/**
 * Ensure output directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Check if a music file already exists
 */
function trackExists(track) {
  const outputPath = path.join(CONFIG.outputDir, track.path);
  return fs.existsSync(outputPath);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate music using ElevenLabs Music API
 *
 * The API flow:
 * 1. Create a composition plan from the prompt
 * 2. Generate music from the composition plan
 * 3. Poll for completion and download the result
 */
async function generateMusic(track) {
  const client = await getClient();

  log(`  Creating composition plan...`, 'dim');

  // Step 1: Create composition plan
  const plan = await client.music.createCompositionPlan({
    prompt: track.prompt,
    durationSeconds: track.duration,
    instrumental: track.instrumental ?? true,
  });

  log(`  Generating music (this may take a minute)...`, 'dim');

  // Step 2: Generate music from plan
  // The compose method returns a readable stream
  const response = await client.music.compose({
    compositionPlan: plan,
  });

  // Collect all chunks from the stream
  const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Generate music with retry logic
 */
async function generateWithRetry(track, retries = CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const audioBuffer = await generateMusic(track);
      return audioBuffer;
    } catch (error) {
      const errStr = error.message || String(error);

      // Check for specific errors
      if (errStr.includes('bad_prompt') || errStr.includes('copyrighted')) {
        log(`\n  ✗ Prompt rejected: ${errStr}`, 'red');
        throw error; // Don't retry prompt issues
      }

      if (attempt === retries) {
        throw error;
      }
      log(`\n  Retry ${attempt}/${retries} for ${track.id}...`, 'yellow');
      await sleep(CONFIG.delayBetweenRequests * attempt);
    }
  }
}

/**
 * Save audio buffer to file
 */
function saveTrack(track, audioBuffer) {
  const outputPath = path.join(CONFIG.outputDir, track.path);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, audioBuffer);
  return outputPath;
}

/**
 * Test API connectivity
 */
async function testApiConnection() {
  log('\n🎵 Testing ElevenLabs Music API Connection...\n', 'cyan');

  if (!CONFIG.apiKey) {
    log('✗ ELEVENLABS_API_KEY not set!', 'red');
    log('\nSetup instructions:', 'yellow');
    log('  1. Get API key from https://elevenlabs.io/', 'dim');
    log('  2. Create .env file in scripts/audio-generator/', 'dim');
    log('  3. Add: ELEVENLABS_API_KEY=your_key_here', 'dim');
    return false;
  }

  log(`✓ API key found (${CONFIG.apiKey.slice(0, 8)}...)`, 'green');

  try {
    await getClient();
    log('✓ ElevenLabs SDK loaded', 'green');
  } catch (error) {
    log(`✗ Failed to load SDK: ${error.message}`, 'red');
    return false;
  }

  // Test with a short track (minimum 10 seconds)
  const testTrack = {
    id: 'test_music',
    prompt: 'Simple cheerful jingle, piano melody, happy mood',
    duration: 10,
    instrumental: true,
  };

  log(`\nGenerating test track (10 seconds): "${testTrack.prompt}"`, 'dim');
  log('This may take 30-60 seconds...', 'dim');

  try {
    const startTime = Date.now();
    const audioBuffer = await generateMusic(testTrack);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log(`✓ Music generated successfully (${elapsed}s)`, 'green');
    log(`✓ Received ${(audioBuffer.length / 1024).toFixed(1)} KB of audio data`, 'green');

    // Save test file
    const testPath = path.join(__dirname, 'test-music-output.mp3');
    fs.writeFileSync(testPath, audioBuffer);
    log(`✓ Test file saved: ${testPath}`, 'green');

    log('\n═══════════════════════════════════════', 'cyan');
    log('  MUSIC API TEST PASSED!', 'green');
    log('═══════════════════════════════════════', 'cyan');
    log('\nNext steps:', 'dim');
    log('  node generate-music.js --dry-run   # Preview tracks', 'dim');
    log('  node generate-music.js             # Generate all music', 'dim');

    return true;
  } catch (error) {
    log(`\n✗ API Test Failed: ${error.message}`, 'red');

    const errStr = error.message || String(error);
    if (errStr.includes('401') || errStr.includes('Unauthorized')) {
      log('\n  → Invalid API key', 'yellow');
    } else if (errStr.includes('402') || errStr.includes('insufficient') || errStr.includes('subscription')) {
      log('\n  → Eleven Music requires a paid subscription', 'yellow');
      log('  → Check your plan at https://elevenlabs.io/subscription', 'yellow');
    }

    return false;
  }
}

/**
 * Main function
 */
async function main() {
  // Handle --test flag
  if (args.test) {
    const success = await testApiConnection();
    process.exit(success ? 0 : 1);
  }

  // Check API key
  if (!CONFIG.apiKey) {
    log('Error: ELEVENLABS_API_KEY not set!', 'red');
    log('\nRun with --test flag first to verify setup:', 'yellow');
    log('  node generate-music.js --test', 'cyan');
    process.exit(1);
  }

  // Load definitions
  const definitions = loadDefinitions();
  let tracks = definitions.tracks;

  log(`\n${colors.bright}🎵 Rampage Rider Music Generator${colors.reset}`);
  log(`   Using ElevenLabs Eleven Music API\n`);

  // Filter by ID if specified
  if (args.id) {
    tracks = tracks.filter((t) => t.id === args.id);
    log(`Filtering by ID: ${args.id}`, 'cyan');
  }

  if (tracks.length === 0) {
    log('No tracks match the filter criteria.', 'yellow');
    return;
  }

  // Check what needs to be generated
  const toGenerate = args.force ? tracks : tracks.filter((t) => !trackExists(t));
  const skipped = tracks.length - toGenerate.length;

  log(`Total tracks defined: ${definitions.tracks.length}`, 'blue');
  log(`Tracks matching filter: ${tracks.length}`, 'blue');
  log(`Tracks to generate: ${toGenerate.length}`, 'green');
  if (skipped > 0) {
    log(`Skipping existing: ${skipped} (use --force to regenerate)`, 'yellow');
  }
  log('');

  // Dry run mode
  if (args['dry-run']) {
    log('DRY RUN - Would generate:', 'yellow');
    toGenerate.forEach((t) => {
      log(`  • ${t.id} → ${t.path} (${t.duration}s)`, 'cyan');
      log(`    "${t.prompt.substring(0, 70)}${t.prompt.length > 70 ? '...' : ''}"`, 'dim');
    });
    return;
  }

  if (toGenerate.length === 0) {
    log('Nothing to generate. All tracks exist.', 'green');
    log('Use --force to regenerate existing files.', 'dim');
    return;
  }

  // Ensure output directory exists
  ensureDir(CONFIG.outputDir);

  // Ensure SDK is loaded
  await getClient();

  const startTime = Date.now();
  const results = { success: [], failed: [] };

  // Generate tracks sequentially (music generation is slow)
  for (let i = 0; i < toGenerate.length; i++) {
    const track = toGenerate[i];
    log(`\n[${i + 1}/${toGenerate.length}] Generating: ${track.id}`, 'cyan');
    log(`  Prompt: "${track.prompt.substring(0, 60)}..."`, 'dim');
    log(`  Duration: ${track.duration}s`, 'dim');

    try {
      const audioBuffer = await generateWithRetry(track);
      const outputPath = saveTrack(track, audioBuffer);
      results.success.push({ id: track.id, path: outputPath, size: audioBuffer.length });
      log(`  ✓ Saved: ${outputPath}`, 'green');
    } catch (error) {
      results.failed.push({ id: track.id, error: error.message });
      log(`  ✗ Failed: ${error.message}`, 'red');
    }

    // Delay between requests
    if (i < toGenerate.length - 1) {
      await sleep(CONFIG.delayBetweenRequests);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Final report
  console.log('\n');
  log('═'.repeat(50), 'cyan');
  log('MUSIC GENERATION COMPLETE', 'bright');
  log('═'.repeat(50), 'cyan');
  log(`✓ Success: ${results.success.length}`, 'green');
  if (results.failed.length > 0) {
    log(`✗ Failed: ${results.failed.length}`, 'red');
    results.failed.forEach((f) => {
      log(`  - ${f.id}: ${f.error}`, 'red');
    });
  }
  log(`\nTime elapsed: ${elapsed}s`, 'dim');

  const totalBytes = results.success.reduce((sum, s) => sum + s.size, 0);
  log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`, 'dim');
}

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
