#!/usr/bin/env node
/**
 * Simple E2E check for frontend
 * Verifies that key pages render without errors
 */

const http = require('http');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkUrl(url, expectedIncludes = []) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Status ${res.statusCode}`));
          return;
        }

        // Check if expected content is present
        const missing = expectedIncludes.filter(str => !data.includes(str));
        if (missing.length > 0) {
          reject(new Error(`Missing content: ${missing.join(', ')}`));
          return;
        }

        resolve({ status: res.statusCode, length: data.length });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runChecks() {
  log('\n🧪 Running Frontend E2E Checks...\n', 'yellow');

  const checks = [
    {
      name: 'Backend Health Check',
      url: `${BACKEND_URL}/health`,
      includes: ['ok']
    },
    {
      name: 'Frontend Home Page',
      url: FRONTEND_URL,
      includes: ['AION2', '검색']
    },
    {
      name: 'Frontend Ranking Page',
      url: `${FRONTEND_URL}/ranking`,
      includes: ['랭킹', '전투력']
    },
    {
      name: 'Backend Rankings API',
      url: `${BACKEND_URL}/api/rankings`,
      includes: ['items', 'generated_at']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await checkUrl(check.url, check.includes || []);
      log(`✓ ${check.name} (${result.length} bytes)`, 'green');
      passed++;
    } catch (error) {
      log(`✗ ${check.name}: ${error.message}`, 'red');
      failed++;
    }
  }

  log(`\n📊 Results: ${passed} passed, ${failed} failed\n`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('❌ E2E checks failed!', 'red');
    process.exit(1);
  } else {
    log('✅ All E2E checks passed!', 'green');
    process.exit(0);
  }
}

// Run checks
runChecks().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
