// Script to fetch all exercises from ExerciseDB OSS API with rate limiting
const https = require('https');
const fs = require('fs');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fetchPage(cursor) {
  const url = cursor
    ? `https://oss.exercisedb.dev/api/v1/exercises?limit=25&after=${cursor}`
    : `https://oss.exercisedb.dev/api/v1/exercises?limit=25`;
    
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Parse error (status ${res.statusCode}): ${data.slice(0,200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAll() {
  // Check if we already have a cached full dataset
  if (fs.existsSync('exercisedb_all.json')) {
    console.log('Using cached exercisedb_all.json');
    return JSON.parse(fs.readFileSync('exercisedb_all.json', 'utf8'));
  }
  
  let allExercises = [];
  let cursor = null;
  let page = 0;
  
  while (true) {
    page++;
    process.stdout.write(`Fetching page ${page}...`);
    
    let result;
    let retries = 3;
    while (retries > 0) {
      try {
        result = await fetchPage(cursor);
        break;
      } catch(e) {
        retries--;
        if (retries === 0) {
          console.log(`\nFailed after retries: ${e.message}`);
          console.log(`Saving ${allExercises.length} exercises fetched so far...`);
          fs.writeFileSync('exercisedb_all.json', JSON.stringify(allExercises, null, 2));
          return allExercises;
        }
        console.log(` rate limited, waiting 5s...`);
        await sleep(5000);
      }
    }
    
    allExercises = allExercises.concat(result.data);
    process.stdout.write(` got ${result.data.length} (total: ${allExercises.length})\n`);
    
    if (!result.meta.hasNextPage) break;
    cursor = result.meta.nextCursor;
    
    // Throttle: wait 400ms between requests to avoid rate limiting
    await sleep(400);
  }
  
  console.log(`\nTotal exercises fetched: ${allExercises.length}`);
  fs.writeFileSync('exercisedb_all.json', JSON.stringify(allExercises, null, 2));
  console.log('Saved to exercisedb_all.json');
  return allExercises;
}

// Fuzzy match function
function findBestMatch(ourName, allDb) {
  const lower = ourName.toLowerCase()
    .replace(/[()/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const keywords = lower.split(' ').filter(w => w.length > 2);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const ex of allDb) {
    const dbName = ex.name.toLowerCase();
    let score = 0;
    
    for (const kw of keywords) {
      if (dbName.includes(kw)) score++;
    }
    
    // Bonus for exact name containment
    if (dbName.includes(lower)) score += 10;
    
    // Bonus for equipment match
    const equipKeywords = ['barbell', 'dumbbell', 'cable', 'machine', 'smith', 'lever', 'sled'];
    for (const eq of equipKeywords) {
      if (lower.includes(eq) && ex.equipments.some(e => e.toLowerCase().includes(eq))) score += 2;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = ex;
    }
  }
  
  return { match: bestMatch, score: bestScore };
}

async function main() {
  const allExercises = await fetchAll();
  
  const ourExercises = [
    'Incline Barbell Bench Press',
    'Flat Barbell Bench Press',
    'Incline Dumbbell Press',
    'Flat Dumbbell Press',
    'Cable Chest Fly / Crossover',
    'Converging Machine Chest Press',
    'Smith Machine Incline Bench Press',
    'Cable Low-to-High Fly',
    'Parallel Bar Dips (Chest Focus)',
    'Lever Seated Pec Fly (Pec Deck)',
    'Dumbbell Hex Press',
    'Barbell Bent-Over Row',
    'Wide-Grip Lat Pulldown',
    'Neutral-Grip Lat Pulldown (Close Grip)',
    'Seated Cable Row',
    'Cable Low Seated Row',
    'Chest-Supported T-Bar Row',
    'Single-Arm Dumbbell Row',
    'Meadows Row (Landmine / Barbell)',
    'Straight-Arm Cable Lat Pullover',
    'Chest-Supported Dumbbell Row',
    'Cable Bar Lateral Pulldown',
    'Standing Overhead Barbell Press (OHP)',
    'Smith Machine Seated Shoulder Press',
    'Dumbbell Lateral Raise',
    'Cable Lateral Raise',
    'Behind-the-Back Cable Lateral Raise',
    'Cable Face Pull with External Rotation',
    'Lever Seated Reverse Fly (Rear Delt Machine)',
    'Lu Lateral Raises (Full ROM)',
    'Barbell Behind-the-Back Wrist Curl',
    'Seated Dumbbell Wrist Curl',
    'Dumbbell Reverse Wrist Curl',
    'Standing Cable Wrist Curl',
    'Barbell Reverse Grip Curl',
    'Standing Cable Reverse Curl',
    'Dumbbell Cross-Body Hammer Curl',
    'Dead Hang (Grip & Forearm Resilience)',
    'Plate Pinch Grip Hold',
    'Barbell Back Squat',
    'Sled Hack Squat',
    'Pendulum Squat',
    'Bulgarian Split Squat (Dumbbell)',
    '45-Degree Incline Leg Press',
    'Leg Extension',
    'Walking Dumbbell Lunge',
    'Barbell Romanian Deadlift (RDL)',
    'Dumbbell Romanian Deadlift (DB RDL)',
    'Barbell Hip Thrust',
    'Lying Leg Curl',
    'Seated Leg Curl',
    'Standing Barbell Bicep Curl',
    'Incline Dumbbell Bicep Curl',
    'Bayesian Cable Curl (Behind-the-Back)',
    'Standing Dumbbell Hammer Curl',
    'Cable Rope Hammer Curl',
    'Lever Machine Preacher Curl',
    'Cable Overhead / High Pulley Bicep Curl',
    'Cable Triceps Rope Pushdown',
    'Cable Triceps Pushdown (V-bar)',
    'Overhead Cable Rope Triceps Extension',
    'EZ-Bar Skull Crushers (Lying Triceps Extension)',
    'Seated Overhead Dumbbell Triceps Extension',
    'Close-Grip Barbell Bench Press',
    'Standing Calf Machine Raise',
    'Seated Machine Calf Raise',
    'Leg Press Machine Calf Press',
    'Hanging Knee / Leg Raise',
    'Hanging Straight Leg Raise',
    'Cable Kneeling Rope Crunch',
    'Ab Wheel Rollout',
    'High-to-Low Cable Woodchoppers',
    'Cable Pallof Press (Anti-Rotation Core)'
  ];
  
  console.log('\n=== EXERCISE MAPPING ===\n');
  const mapping = {};
  let matched = 0, unmatched = 0;
  
  for (const name of ourExercises) {
    const { match, score } = findBestMatch(name, allExercises);
    if (match && score >= 2) {
      matched++;
      console.log(`✓ ${name}`);
      console.log(`  -> ${match.name} (score: ${score})`);
      mapping[name] = { exerciseDbId: match.exerciseId, gifUrl: match.gifUrl, matchedName: match.name, score };
    } else {
      unmatched++;
      console.log(`✗ ${name} (best score: ${score})`);
      if (match) console.log(`  -> best: ${match.name}`);
    }
  }
  
  fs.writeFileSync('exercise_gif_mapping.json', JSON.stringify(mapping, null, 2));
  console.log(`\n=== RESULTS ===`);
  console.log(`Matched: ${matched}/${ourExercises.length}`);
  console.log(`Unmatched: ${unmatched}/${ourExercises.length}`);
  console.log(`Mapping saved to exercise_gif_mapping.json`);
}

main().catch(console.error);
