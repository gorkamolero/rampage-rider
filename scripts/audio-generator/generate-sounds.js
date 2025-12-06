#!/usr/bin/env node

/**
 * ElevenLabs Sound Effect Generator for Rampage Rider
 *
 * Generates all game sound effects using the ElevenLabs SFX API.
 * Uses the official @elevenlabs/elevenlabs-js SDK.
 *
 * Usage:
 *   # Test API connection (generates 1 short test sound)
 *   node generate-sounds.js --test
 *
 *   # Generate all sounds
 *   node generate-sounds.js
 *
 *   # Generate specific category
 *   node generate-sounds.js --category=kills
 *
 *   # Generate single sound by ID
 *   node generate-sounds.js --id=knife_whoosh
 *
 *   # Dry run (show what would be generated)
 *   node generate-sounds.js --dry-run
 *
 *   # Force regenerate existing files
 *   node generate-sounds.js --force
 *
 *   # Show stats about definitions
 *   node generate-sounds.js --stats
 *
 *   # Generate with parallelism (faster but uses more rate limit)
 *   node generate-sounds.js --parallel=3
 *
 * Environment:
 *   ELEVENLABS_API_KEY - Your ElevenLabs API key
 *
 * Setup:
 *   1. Get API key from https://elevenlabs.io/
 *   2. Run: pnpm install (installs @elevenlabs/elevenlabs-js)
 *   3. Create .env file: ELEVENLABS_API_KEY=your_key_here
 *   4. Run: node generate-sounds.js --test
 *   5. If test passes, run: node generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch {
  // dotenv not installed, will use process.env directly
}

// Configuration
const CONFIG = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  outputFormat: 'mp3_44100_128', // MP3 at 44.1kHz, 128kbps
  promptInfluence: 0.3, // 0-1, how closely to follow the prompt
  outputDir: path.join(__dirname, '../../public/audio'),
  definitionsFile: path.join(__dirname, 'sound-definitions.json'),
  delayBetweenRequests: 500, // ms delay to avoid rate limiting
  maxRetries: 3,
  parallelRequests: 1, // default sequential
};

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value ?? true;
  }
  return acc;
}, {});

if (args.parallel) {
  CONFIG.parallelRequests = parseInt(args.parallel, 10) || 1;
}

if (args.definitions) {
  CONFIG.definitionsFile = path.join(__dirname, args.definitions);
}

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

function logProgress(current, total, id) {
  const percent = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
  process.stdout.write(
    `\r${colors.cyan}[${bar}] ${percent}% ${colors.reset}(${current}/${total}) ${id.padEnd(25)}`
  );
}

/**
 * Load sound definitions from JSON file
 */
function loadDefinitions() {
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
 * Check if a sound file already exists
 */
function soundExists(sound) {
  const outputPath = path.join(CONFIG.outputDir, sound.path);
  return fs.existsSync(outputPath);
}

/**
 * Get or create ElevenLabs client
 */
let _client = null;
async function getClient() {
  if (_client) return _client;

  try {
    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
    _client = new ElevenLabsClient({
      apiKey: CONFIG.apiKey,
    });
    return _client;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      log('ElevenLabs SDK not installed. Installing...', 'yellow');
      const { execSync } = require('child_process');
      execSync('pnpm add @elevenlabs/elevenlabs-js dotenv', {
        cwd: __dirname,
        stdio: 'inherit'
      });
      // Retry after install
      const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js');
      _client = new ElevenLabsClient({
        apiKey: CONFIG.apiKey,
      });
      return _client;
    }
    throw error;
  }
}

/**
 * Generate a single sound effect using ElevenLabs SDK
 */
async function generateSound(sound) {
  const client = await getClient();

  const response = await client.textToSoundEffects.convert({
    text: sound.prompt,
    durationSeconds: sound.duration,
    promptInfluence: CONFIG.promptInfluence,
    // Enable loop mode for sounds marked as loops - creates seamless audio
    ...(sound.loop && { loop: true }),
  });

  // Response is a ReadableStream, collect all chunks
  const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Save audio buffer to file
 */
function saveSound(sound, audioBuffer) {
  const outputPath = path.join(CONFIG.outputDir, sound.path);
  const outputDir = path.dirname(outputPath);

  ensureDir(outputDir);
  fs.writeFileSync(outputPath, audioBuffer);

  return outputPath;
}

/**
 * Generate sound with retry logic
 */
async function generateWithRetry(sound, retries = CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const audioBuffer = await generateSound(sound);
      return audioBuffer;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      log(`\n  Retry ${attempt}/${retries} for ${sound.id}...`, 'yellow');
      await sleep(CONFIG.delayBetweenRequests * attempt * 2);
    }
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test API connectivity with a simple request
 */
async function testApiConnection() {
  log('\n🧪 Testing ElevenLabs API Connection...\n', 'cyan');

  // Check API key
  if (!CONFIG.apiKey) {
    log('✗ ELEVENLABS_API_KEY not set!', 'red');
    log('\nSetup instructions:', 'yellow');
    log('  1. Get API key from https://elevenlabs.io/', 'dim');
    log('  2. Create .env file in scripts/audio-generator/', 'dim');
    log('  3. Add: ELEVENLABS_API_KEY=your_key_here', 'dim');
    return false;
  }

  log(`✓ API key found (${CONFIG.apiKey.slice(0, 8)}...)`, 'green');

  // Test SDK import
  try {
    await getClient();
    log('✓ ElevenLabs SDK loaded', 'green');
  } catch (error) {
    log(`✗ Failed to load SDK: ${error.message}`, 'red');
    return false;
  }

  // Test with a simple short sound
  const testSound = {
    id: 'test_beep',
    prompt: 'Short digital beep, single tone, video game',
    duration: 0.5,
    loop: false,
  };

  log(`\nGenerating test sound: "${testSound.prompt}"`, 'dim');

  try {
    const startTime = Date.now();
    const audioBuffer = await generateSound(testSound);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`✓ API responded successfully (${elapsed}s)`, 'green');
    log(`✓ Received ${audioBuffer.length} bytes of audio data`, 'green');

    // Save test file
    const testPath = path.join(__dirname, 'test-output.mp3');
    fs.writeFileSync(testPath, audioBuffer);
    log(`✓ Test file saved: ${testPath}`, 'green');

    // Verify file is valid MP3 (check for ID3 or MP3 frame sync)
    const isValidMp3 =
      audioBuffer[0] === 0xff || // MP3 frame sync
      (audioBuffer[0] === 0x49 && audioBuffer[1] === 0x44 && audioBuffer[2] === 0x33); // ID3

    if (isValidMp3) {
      log(`✓ Audio file appears to be valid MP3`, 'green');
    } else {
      log(`⚠ Audio file format uncertain (first bytes: ${audioBuffer.slice(0, 4).toString('hex')})`, 'yellow');
    }

    // Test loop generation
    log(`\nTesting loop generation...`, 'dim');
    const loopTestSound = {
      id: 'test_loop',
      prompt: 'Ambient hum, electronic drone',
      duration: 2.0,
      loop: true,
    };

    const loopStartTime = Date.now();
    const loopBuffer = await generateSound(loopTestSound);
    const loopElapsed = ((Date.now() - loopStartTime) / 1000).toFixed(2);

    const loopTestPath = path.join(__dirname, 'test-loop-output.mp3');
    fs.writeFileSync(loopTestPath, loopBuffer);
    log(`✓ Loop test generated (${loopElapsed}s): ${loopTestPath}`, 'green');

    log('\n═══════════════════════════════════════', 'cyan');
    log('  API TEST PASSED - Ready to generate!', 'green');
    log('═══════════════════════════════════════', 'cyan');
    log('\nNext steps:', 'dim');
    log('  node generate-sounds.js --dry-run       # Preview what will be generated', 'dim');
    log('  node generate-sounds.js                 # Generate all sounds', 'dim');
    log('  node generate-sounds.js --category=ui   # Generate specific category', 'dim');
    log('  node generate-sounds.js --parallel=3    # Generate 3 at a time (faster)', 'dim');

    return true;
  } catch (error) {
    log(`\n✗ API Test Failed: ${error.message}`, 'red');

    const errStr = error.message || String(error);
    if (errStr.includes('401') || errStr.includes('Unauthorized')) {
      log('\n  → Invalid API key. Check your ELEVENLABS_API_KEY', 'yellow');
    } else if (errStr.includes('429') || errStr.includes('rate')) {
      log('\n  → Rate limited. Wait a moment and try again', 'yellow');
    } else if (errStr.includes('402') || errStr.includes('insufficient')) {
      log('\n  → Insufficient credits. Top up your ElevenLabs account', 'yellow');
    }

    return false;
  }
}

/**
 * Show statistics about sound definitions
 */
function showStats() {
  const definitions = loadDefinitions();
  const sounds = definitions.sounds;

  log('\n📊 Sound Definitions Statistics\n', 'cyan');
  log(`Total sounds: ${sounds.length}`, 'bright');
  log(`Estimated credits: ~${definitions.meta.estimatedCredits || 'unknown'}`, 'dim');

  // Group by category
  const byCategory = {};
  let totalDuration = 0;
  let loopCount = 0;

  sounds.forEach((s) => {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    totalDuration += s.duration;
    if (s.loop) loopCount++;
  });

  log('\nBy category:', 'bright');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      log(`  ${cat.padEnd(15)} ${count}`, 'dim');
    });

  log(`\nTotal duration: ${totalDuration.toFixed(1)}s`, 'dim');
  log(`Loop sounds: ${loopCount}`, 'dim');

  // Check what already exists
  let existingCount = 0;
  sounds.forEach((s) => {
    if (soundExists(s)) existingCount++;
  });

  log(`\nExisting files: ${existingCount}/${sounds.length}`, existingCount === sounds.length ? 'green' : 'yellow');
  log(`Remaining: ${sounds.length - existingCount}`, 'dim');
}

/**
 * Process sounds in batches with parallelism
 */
async function processBatch(sounds, batchSize, onProgress) {
  const results = { success: [], failed: [] };

  for (let i = 0; i < sounds.length; i += batchSize) {
    const batch = sounds.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (sound) => {
        const audioBuffer = await generateWithRetry(sound);
        const outputPath = saveSound(sound, audioBuffer);
        return { id: sound.id, path: outputPath, size: audioBuffer.length };
      })
    );

    batchResults.forEach((result, idx) => {
      const sound = batch[idx];
      if (result.status === 'fulfilled') {
        results.success.push(result.value);
      } else {
        results.failed.push({ id: sound.id, error: result.reason.message });
        log(`\n  ✗ Failed: ${sound.id} - ${result.reason.message}`, 'red');
      }
      onProgress(i + idx + 1, sounds.length, sound.id);
    });

    // Delay between batches
    if (i + batchSize < sounds.length) {
      await sleep(CONFIG.delayBetweenRequests);
    }
  }

  return results;
}

/**
 * Main generation function
 */
async function main() {
  // Handle --test flag
  if (args.test) {
    const success = await testApiConnection();
    process.exit(success ? 0 : 1);
  }

  // Handle --stats flag
  if (args.stats) {
    showStats();
    return;
  }

  // Check API key for generation
  if (!CONFIG.apiKey) {
    log('Error: ELEVENLABS_API_KEY not set!', 'red');
    log('\nRun with --test flag first to verify setup:', 'yellow');
    log('  node generate-sounds.js --test', 'cyan');
    process.exit(1);
  }

  // Load definitions
  const definitions = loadDefinitions();
  let sounds = definitions.sounds;

  log(`\n${colors.bright}🔊 Rampage Rider Audio Generator${colors.reset}`);
  log(`   Using ElevenLabs SFX API (SDK)\n`);

  // Filter by category if specified
  if (args.category) {
    sounds = sounds.filter((s) => s.category === args.category);
    log(`Filtering by category: ${args.category}`, 'cyan');
  }

  // Filter by ID if specified
  if (args.id) {
    sounds = sounds.filter((s) => s.id === args.id);
    log(`Filtering by ID: ${args.id}`, 'cyan');
  }

  if (sounds.length === 0) {
    log('No sounds match the filter criteria.', 'yellow');
    return;
  }

  // Check what needs to be generated
  const toGenerate = args.force ? sounds : sounds.filter((s) => !soundExists(s));
  const skipped = sounds.length - toGenerate.length;

  log(`Total sounds defined: ${definitions.sounds.length}`, 'blue');
  log(`Sounds matching filter: ${sounds.length}`, 'blue');
  log(`Sounds to generate: ${toGenerate.length}`, 'green');
  if (skipped > 0) {
    log(`Skipping existing: ${skipped} (use --force to regenerate)`, 'yellow');
  }
  if (CONFIG.parallelRequests > 1) {
    log(`Parallel requests: ${CONFIG.parallelRequests}`, 'magenta');
  }
  log('');

  // Dry run mode
  if (args['dry-run']) {
    log('DRY RUN - Would generate:', 'yellow');
    toGenerate.forEach((s) => {
      const loopTag = s.loop ? ' [LOOP]' : '';
      log(`  • ${s.id} → ${s.path} (${s.duration}s)${loopTag}`, 'cyan');
      log(`    "${s.prompt.substring(0, 70)}${s.prompt.length > 70 ? '...' : ''}"`, 'dim');
    });

    const totalDuration = toGenerate.reduce((sum, s) => sum + s.duration, 0);
    log(`\nTotal audio duration: ${totalDuration.toFixed(1)}s`, 'dim');

    const estimatedMinutes = Math.ceil((toGenerate.length * 2) / CONFIG.parallelRequests / 60);
    log(`Estimated time: ~${estimatedMinutes} minutes`, 'dim');
    return;
  }

  if (toGenerate.length === 0) {
    log('Nothing to generate. All sounds exist.', 'green');
    log('Use --force to regenerate existing files.', 'dim');
    return;
  }

  // Ensure base output directory exists
  ensureDir(CONFIG.outputDir);

  // Ensure SDK is loaded before starting
  await getClient();

  const startTime = Date.now();
  let results;

  if (CONFIG.parallelRequests > 1) {
    // Parallel generation
    results = await processBatch(toGenerate, CONFIG.parallelRequests, logProgress);
  } else {
    // Sequential generation
    results = { success: [], failed: [] };

    for (let i = 0; i < toGenerate.length; i++) {
      const sound = toGenerate[i];
      logProgress(i + 1, toGenerate.length, sound.id);

      try {
        const audioBuffer = await generateWithRetry(sound);
        const outputPath = saveSound(sound, audioBuffer);
        results.success.push({ id: sound.id, path: outputPath, size: audioBuffer.length });
      } catch (error) {
        results.failed.push({ id: sound.id, error: error.message });
        log(`\n  ✗ Failed: ${sound.id} - ${error.message}`, 'red');
      }

      // Delay between requests to avoid rate limiting
      if (i < toGenerate.length - 1) {
        await sleep(CONFIG.delayBetweenRequests);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Final report
  console.log('\n');
  log('═'.repeat(50), 'cyan');
  log('GENERATION COMPLETE', 'bright');
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

  log('');

  // Save generation report
  const reportPath = path.join(__dirname, 'generation-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: {
          outputFormat: CONFIG.outputFormat,
          promptInfluence: CONFIG.promptInfluence,
          parallelRequests: CONFIG.parallelRequests,
        },
        elapsed: `${elapsed}s`,
        results,
      },
      null,
      2
    )
  );
  log(`Report saved: ${reportPath}`, 'blue');
}

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
