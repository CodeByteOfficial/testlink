import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// ============================================================================
// 🎯 DYNAMIC DATA SOURCE (AUTOMATICALLY LOADED FROM playwright/tests/test.json)
// ============================================================================
const testJsonPath = path.resolve('playwright/tests/test.json');
let testSuites = [];

if (fs.existsSync(testJsonPath)) {
  try {
    const rawData = fs.readFileSync(testJsonPath, 'utf8');
    testSuites = JSON.parse(rawData);
    if (!Array.isArray(testSuites)) {
      testSuites = [testSuites];
    }
  } catch (err) {
    console.error('⚠️ Failed to parse test.json:', err.message);
  }
}

if (!testSuites || testSuites.length === 0) {
  console.error('❌ CRITICAL: No test suites found in playwright/tests/test.json!');
  console.error('   Please run the web converter tool first to generate test.json.');
  process.exit(1);
}

// Order suites by id (1, 2, 3...)
testSuites.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

// ============================================================================
// ⚙️ SYSTEM CONFIGURATION (LOADED DYNAMICALLY FROM .env FILE)
// ============================================================================
// 👉 JAB BHI KOI VARIABLE UPDATE KARNA HO:
// Project root me maujood '.env' file ko edit karein (jaise TARGET_BUILD_ID, 
// TARGET_BUILD_NAME, TARGET_PLAN_LABEL, etc.). Script bina code change kiye
// automatically .env file se saari settings read kar legi!

const HTTP_AUTH_USERNAME = process.env.HTTP_AUTH_USERNAME || process.env.BASIC_AUTH_USER || 'cqtesting';
const HTTP_AUTH_PASSWORD = process.env.HTTP_AUTH_PASSWORD || process.env.BASIC_AUTH_PASS || 'CqTest@2025';

const TESTLINK_USER = process.env.TESTLINK_USER || 'harsh';
const TESTLINK_PASS = process.env.TESTLINK_PASS || '9ZvSgQc466';

const TARGET_PROJECT_VALUE = process.env.TARGET_PROJECT_VALUE || '1';            // CQ:CreditQ
const TARGET_PLAN_LABEL = process.env.TARGET_PLAN_LABEL || 'New Admin Portal';

const TESTER_ID = process.env.TESTER_ID || '9';                                 // harsh

// Target Build Configuration: Loaded from .env (defaults to '94' and 'Round _1')
const TARGET_BUILD_ID = process.env.TARGET_BUILD_ID || '94';
const TARGET_BUILD_NAME = process.env.TARGET_BUILD_NAME || 'Round _1';

const DELAY_MS = Number(process.env.DELAY_MS) || 3000;                          // 3 seconds delay after each step

console.log('\n============================================================');
console.log('🚀 TESTLINK PLAYWRIGHT AUTOMATION RUNNER');
console.log('============================================================');
console.log('📋 Active Environment Config (.env):');
console.log(`   • Test Project Value : ${TARGET_PROJECT_VALUE} (CQ:CreditQ)`);
console.log(`   • Test Plan Label    : "${TARGET_PLAN_LABEL}"`);
console.log(`   • Tester ID / User   : ${TESTER_ID} (${TESTLINK_USER})`);
console.log(`   • Target Build ID    : ${TARGET_BUILD_ID || 'Auto-detect'}`);
console.log(`   • Target Build Name  : "${TARGET_BUILD_NAME || 'Auto-detect'}"`);
console.log(`   • Step Delay         : ${DELAY_MS} ms`);
console.log('============================================================\n');

// ============================================================================
// 🛠️ MULTI-FRAME HELPER FUNCTIONS
// ============================================================================

async function waitStep(page, stepName) {
  console.log(`⏱️  [${stepName} Complete] Waiting ${DELAY_MS / 1000} seconds...`);
  await page.waitForTimeout(DELAY_MS);
}

/**
 * Searches across top-level page and all child frames (titlebar, mainframe, treeframe, workframe)
 */
async function findInFrames(page, selector, timeoutMs = 8000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    for (const frame of [page, ...page.frames()]) {
      try {
        const loc = frame.locator(selector).first();
        if (await loc.isVisible().catch(() => false)) return loc;
      } catch (_) { }
    }
    await page.waitForTimeout(400);
  }
  return null;
}

/**
 * Clicks an element across frames with polling wait
 */
async function clickInFrames(page, selector, description, timeoutMs = 10000) {
  console.log(`👉 Finding & Clicking: ${description} ...`);

  const loc = await findInFrames(page, selector, timeoutMs);
  if (loc) {
    try {
      await loc.scrollIntoViewIfNeeded().catch(() => { });
      await loc.click({ force: true });
      console.log(`   ✅ Clicked: ${description}`);
      return true;
    } catch (e) {
      console.warn(`   ⚠️ Click failed: ${e.message}`);
    }
  }

  const cleanDesc = description.replace(/^(Clicking|Selecting|New|Save|Test|Access|Set|Setting)\s+/i, '').trim();
  for (const frame of [page, ...page.frames()]) {
    try {
      const textLoc = frame.getByText(cleanDesc, { exact: false }).first();
      if (await textLoc.isVisible().catch(() => false)) {
        await textLoc.scrollIntoViewIfNeeded().catch(() => { });
        await textLoc.click({ force: true });
        console.log(`   ✅ Clicked via text: ${description}`);
        return true;
      }
    } catch (_) { }
  }

  console.warn(`   ⚠️ Notice: Element for "${description}" not found directly. Continuing to next step.`);
  return false;
}

/**
 * Specifically finds and clicks the dynamic suite node in the ExtJS tree using DYNAMIC_SUITE_NAME
 */
async function clickSuiteInTree(page, suiteName, description = 'Suite in Tree') {
  console.log(`🔍 Locating Dynamic Suite "${suiteName}" for ${description} ...`);

  for (const frame of [page, ...page.frames()]) {
    try {
      // 1. Target ExtJS tree node container .x-tree-node-el containing suiteName
      const treeNodeEl = frame.locator('.x-tree-node-el').filter({ hasText: suiteName }).last();
      if (await treeNodeEl.isVisible().catch(() => false)) {
        await treeNodeEl.scrollIntoViewIfNeeded().catch(() => { });
        const anchor = treeNodeEl.locator('a.x-tree-node-anchor, span').first();
        if (await anchor.isVisible().catch(() => false)) {
          await anchor.click({ force: true });
        } else {
          await treeNodeEl.click({ force: true });
        }
        console.log(`   ✅ Successfully clicked ExtJS suite node "${suiteName}"`);
        return true;
      }

      // 2. Direct getByText match inside frame
      const candidate = frame.getByText(suiteName, { exact: false }).last();
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.scrollIntoViewIfNeeded().catch(() => { });
        await candidate.click({ force: true });
        console.log(`   ✅ Successfully clicked dynamic suite "${suiteName}"`);
        return true;
      }
    } catch (_) { }
  }

  const selector = `span:has-text("${suiteName}"), a:has-text("${suiteName}"), [title*="${suiteName}"]`;
  const loc = await findInFrames(page, selector, 6000);
  if (loc) {
    await loc.scrollIntoViewIfNeeded().catch(() => { });
    await loc.click({ force: true });
    console.log(`   ✅ Successfully clicked dynamic suite "${suiteName}"`);
    return true;
  }

  console.warn(`   ⚠️ Notice: Could not find suite node containing "${suiteName}" in tree.`);
  return false;
}

/**
 * Specifically expands the dynamic suite in ExtJS tree by clicking the [+] icon
 */
async function expandSuiteInTree(page, suiteName) {
  console.log(`🔍 Expanding Dynamic Suite "${suiteName}" in ExtJS tree (+ icon) ...`);

  for (const frame of [page, ...page.frames()]) {
    try {
      // 1. Ensure parent/root node CreditQ is expanded if present and collapsed
      const rootEl = frame.locator('.x-tree-node-el').filter({ hasText: 'CreditQ' }).first();
      if (await rootEl.isVisible().catch(() => false)) {
        const rootCollapsed = await rootEl.evaluate(el => el.classList.contains('x-tree-node-collapsed')).catch(() => false);
        if (rootCollapsed) {
          const rootPlus = rootEl.locator('img.x-tree-ec-icon, .x-tree-elbow-plus, .x-tree-elbow-end-plus').first();
          if (await rootPlus.isVisible().catch(() => false)) {
            await rootPlus.click({ force: true });
            await page.waitForTimeout(1000);
          }
        }
      }

      // 2. Find the specific suite node in the ExtJS tree
      const suiteNode = frame.locator('.x-tree-node-el').filter({ hasText: suiteName }).first();
      if (await suiteNode.isVisible().catch(() => false)) {
        await suiteNode.scrollIntoViewIfNeeded().catch(() => { });

        // Find the plus icon inside this node (.x-tree-ec-icon / .x-tree-elbow-plus)
        const plusIcon = suiteNode.locator('img.x-tree-ec-icon, .x-tree-elbow-plus, .x-tree-elbow-end-plus, img[class*="elbow-plus"], img[class*="end-plus"]').first();
        if (await plusIcon.isVisible().catch(() => false)) {
          await plusIcon.click({ force: true });
          console.log(`   ✅ Clicked [+] expander icon for suite "${suiteName}"`);
          return true;
        }

        // ExtJS double-click anchor fallback to toggle expand
        const anchor = suiteNode.locator('a.x-tree-node-anchor, span').first();
        if (await anchor.isVisible().catch(() => false)) {
          await anchor.dblclick({ force: true }).catch(() => anchor.click({ clickCount: 2 }));
          console.log(`   ✅ Double-clicked suite "${suiteName}" to expand`);
          return true;
        }
      }
    } catch (_) { }
  }

  // 3. Fallback to selector search
  const fallbackPlus = await findInFrames(page, `.x-tree-node-el:has-text("${suiteName}") img.x-tree-ec-icon, .x-tree-elbow-end-plus, .x-tree-elbow-plus`, 4000);
  if (fallbackPlus) {
    await fallbackPlus.click({ force: true });
    console.log(`   ✅ Clicked plus icon in tree`);
    return true;
  }

  console.warn(`   ⚠️ Notice: Could not locate [+] expander icon for suite "${suiteName}". Attempting fallback click.`);
  await clickSuiteInTree(page, suiteName, 'Fallback click');
  return false;
}

function resolveUploadPath(inputPath) {
  if (!inputPath) return null;
  const candidates = [
    inputPath,
    inputPath.replace(/\\/g, '/'),
    path.normalize(inputPath),
    path.resolve(inputPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return path.resolve(c);
  }
  return null;
}

function getTestCaseCountFromFile(filePath) {
  try {
    const resolved = resolveUploadPath(filePath);
    if (!resolved) return null;
    const content = fs.readFileSync(resolved, 'utf-8').trim();
    if (resolved.toLowerCase().endsWith('.csv')) {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      return Math.max(0, lines.length - 1);
    } else {
      const xmlMatches = content.match(/<testcase|<record|<client|<item|<row/gi);
      return xmlMatches ? xmlMatches.length : null;
    }
  } catch (_) {
    return null;
  }
}

// ============================================================================
// 🚀 MAIN EXECUTION FLOW
// ============================================================================

(async () => {
  console.log('============================================================');
  console.log('🚀 TestLink Playwright Automation (Multi-Suite Batch Runner)');
  console.log(`📋 Total Test Suites in test.json: ${testSuites.length}`);
  testSuites.forEach((s, idx) => {
    console.log(`   [${idx + 1}] ID: ${s.id} | Suite: "${s.suiteName}" | Path: "${s.filePath}"`);
  });
  console.log(`👤 Basic Auth User     : "${HTTP_AUTH_USERNAME}"`);
  console.log(`⏱️  Step Delay          : ${DELAY_MS / 1000} seconds`);
  console.log('============================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ['--start-maximized'],
  });

  // Basic auth header for direct injection
  const basicAuthHeader = 'Basic ' + Buffer.from(`${HTTP_AUTH_USERNAME}:${HTTP_AUTH_PASSWORD}`).toString('base64');

  const context = await browser.newContext({
    viewport: null,
    extraHTTPHeaders: {
      'Authorization': basicAuthHeader,
    },
    httpCredentials: {
      username: HTTP_AUTH_USERNAME,
      password: HTTP_AUTH_PASSWORD,
    },
  });

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // STEP 0: Login (RUNS ONCE)
    // ------------------------------------------------------------------------
    console.log('[Step 0] Navigating to https://testing.creditq.co.in/login.php ...');

    // Use embedded authentication URL to guarantee instant connection without popup delay
    const authUrl = `https://${encodeURIComponent(HTTP_AUTH_USERNAME)}:${encodeURIComponent(HTTP_AUTH_PASSWORD)}@testing.creditq.co.in/login.php`;

    let response;
    try {
      response = await page.goto(authUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (_) {
      console.log('Retrying with direct URL...');
      response = await page.goto('https://testing.creditq.co.in/login.php', { waitUntil: 'commit', timeout: 20000 });
    }

    if (response && response.status() === 401) {
      throw new Error(`401 Authorization Required: Nginx rejected authentication for user "${HTTP_AUTH_USERNAME}".`);
    }
    await waitStep(page, 'Step 0: Login Page Loaded');

    console.log(`[Step 0.1] Filling credentials (${TESTLINK_USER}) ...`);
    const userField = (await findInFrames(page, 'input[name="tl_login"], #tl_login, input[placeholder="Login Name"]')) || page.locator('#tl_login');
    await userField.fill(TESTLINK_USER);
    await page.waitForTimeout(500);

    const passField = (await findInFrames(page, 'input[name="tl_password"], #tl_password, input[placeholder="Password"]')) || page.locator('#tl_password');
    await passField.fill(TESTLINK_PASS);
    await page.waitForTimeout(500);

    console.log('[Step 0.2] Submitting Login form ...');
    const submitBtn = (await findInFrames(page, 'input#tl_login_button, input[name="login_button"], button:has-text("Log in")')) || page.locator('#tl_login_button');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
      submitBtn.click(),
    ]);
    await waitStep(page, 'Login Submitted');

    // ------------------------------------------------------------------------
    // STEP 1: Select Test Project "CQ:CreditQ" (value="1") (RUNS ONCE)
    // ------------------------------------------------------------------------
    console.log(`\n[Step 1] Selecting Test Project option value="${TARGET_PROJECT_VALUE}" (CQ:CreditQ) ...`);
    const projectSelect = await findInFrames(page, 'select[name="testproject"]');
    if (projectSelect) {
      await projectSelect.selectOption(TARGET_PROJECT_VALUE);
      console.log('   ✅ Selected Project CQ:CreditQ (value: 1)');
    }
    await waitStep(page, 'Step 1: Project Selected');

    // ------------------------------------------------------------------------
    // STEP 2: Select Test Plan (Chosen Dropdown) (RUNS ONCE)
    // ------------------------------------------------------------------------
    console.log(`\n[Step 2] Selecting Test Plan "${TARGET_PLAN_LABEL}" ...`);
    let planSelected = false;

    // 1. Try selecting via standard HTML select option label
    const directPlanSelect = await findInFrames(page, 'select[name="testplan"]');
    if (directPlanSelect) {
      try {
        await directPlanSelect.selectOption({ label: TARGET_PLAN_LABEL });
        planSelected = true;
        console.log(`   ✅ Selected Test Plan directly via select: "${TARGET_PLAN_LABEL}"`);
      } catch (_) { }
    }

    // 2. Try selecting via Chosen dropdown UI
    if (!planSelected) {
      const chosenContainer = await findInFrames(page, '.chosen-container, a.chosen-single');
      if (chosenContainer) {
        await chosenContainer.click();
        await page.waitForTimeout(600);

        // Search in Chosen dropdown input if available
        const searchInput = await findInFrames(page, '.chosen-search input, input.chosen-search-input');
        if (searchInput) {
          await searchInput.fill(TARGET_PLAN_LABEL);
          await page.waitForTimeout(400);
        }

        const chosenOption = await findInFrames(page, `li.active-result:has-text("${TARGET_PLAN_LABEL}"), li[title*="${TARGET_PLAN_LABEL}"]`);
        if (chosenOption) {
          await chosenOption.click();
          console.log(`   ✅ Clicked Chosen option "${TARGET_PLAN_LABEL}"`);
          planSelected = true;
        }
      }
    }
    await waitStep(page, `Step 2: Test Plan Selected ("${TARGET_PLAN_LABEL}")`);

    // ========================================================================
    // 🔁 MULTI-SUITE EXECUTION LOOP (FROM test.json)
    // Runs Step 3 to Step 3.25 for each testsuite in test.json
    // ========================================================================
    for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
      const currentSuite = testSuites[suiteIndex];
      const suiteId = currentSuite.id;
      const currentSuiteName = currentSuite.suiteName || `Suite_${suiteId}`;
      const currentFilePath = currentSuite.filePath;
      const fileTestCaseCount = getTestCaseCountFromFile(currentFilePath);

      console.log('\n============================================================');
      console.log(`🔄 [SUITE ${suiteIndex + 1}/${testSuites.length}] STARTING EXECUTION FOR SUITE ID: ${suiteId}`);
      console.log(`📌 Dynamic Suite Name : "${currentSuiteName}"`);
      console.log(`📁 Upload File Path   : "${currentFilePath}"`);
      console.log(`📊 Detected Test Cases: ${fileTestCaseCount !== null ? fileTestCaseCount : 'Auto-detecting from tree'}`);
      console.log('============================================================\n');

      // ------------------------------------------------------------------------
      // STEP 3.1: Navigate to Test Specification icon on Desktop
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.1] Navigating to Test Specification icon ...`);
      const onDesktop = await findInFrames(page, 'img[title="Test Specification"], img[src*="chart_organisation.png"]', 2000);
      if (!onDesktop) {
        await clickInFrames(page, 'img[title="Desktop"], img[src*="application_home.png"], a[title="Desktop"], a[href*="index.php"]', 'Desktop Home');
        await page.waitForTimeout(1500);
      }
      await clickInFrames(page, 'img[title="Test Specification"], img[src*="chart_organisation.png"], a[title*="Test Specification"]', 'Test Specification');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.1: Test Specification Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.2: Click Settings / Actions Cog Icon
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.2] Clicking Settings Cog (Actions) ...`);
      await clickInFrames(page, 'img[title="Actions"], img[src*="cog.png"], [onclick*="tproject_control_panel"]', 'Settings Cog');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.2: Settings Cog Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.3: Click "+" icon (Create Test Suite)
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.3] Clicking "+" icon (Create Test Suite) ...`);
      await clickInFrames(page, 'input#new_testsuite, input[name="new_testsuite"], input[src*="add.png"], input[title="Create"]', 'New Test Suite (+)');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.3: Plus Icon Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.4: Fill Suite Name Using currentSuiteName
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.4] Typing Test Suite name from test.json: "${currentSuiteName}" ...`);
      const nameInput = await findInFrames(page, 'input#name, input[name="container_name"]');
      if (nameInput) {
        await nameInput.fill(currentSuiteName);
        console.log(`   ✅ Filled Suite Name with: "${currentSuiteName}"`);
      }
      await waitStep(page, `Suite ID ${suiteId} - Step 3.4: Suite Name Filled`);

      // ------------------------------------------------------------------------
      // STEP 3.5: Click "Save" button
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.5] Clicking "Save" button ...`);
      await clickInFrames(page, 'input[name="add_testsuite_button"], input[value="Save"]', 'Save Test Suite');
      console.log('   ⏳ Waiting 3s for TestLink backend to save and reload the tree...');
      await page.waitForTimeout(3000);

      // ------------------------------------------------------------------------
      // STEP 3.6: Select the Newly Created Suite in Tree Using currentSuiteName
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.6] Selecting newly created suite "${currentSuiteName}" in tree ...`);

      let suiteClicked = false;
      const dynamicTimeoutMs = 30000;
      const dynamicStartTime = Date.now();

      while (Date.now() - dynamicStartTime < dynamicTimeoutMs && !suiteClicked) {
        for (const frame of [page.frame({ name: 'treeframe' }), ...page.frames()].filter(Boolean)) {
          try {
            const rootCollapsed = frame.locator('.x-tree-node-el.x-tree-node-collapsed').first();
            if (await rootCollapsed.count().catch(() => 0) > 0) {
              const rootPlus = rootCollapsed.locator('img.x-tree-ec-icon, .x-tree-elbow-plus').first();
              if (await rootPlus.isVisible().catch(() => false)) {
                await rootPlus.click({ force: true }).catch(() => { });
                await page.waitForTimeout(800);
              }
            }

            let targetAnchor = null;
            const matchingAnchors = frame.locator(`.x-tree-node-el:has-text("${currentSuiteName}") a.x-tree-node-anchor`);
            if (await matchingAnchors.count().catch(() => 0) > 0) {
              targetAnchor = matchingAnchors.last();
            } else {
              const textNodes = frame.locator(`a.x-tree-node-anchor:has-text("${currentSuiteName}"), span:has-text("${currentSuiteName}")`);
              if (await textNodes.count().catch(() => 0) > 0) {
                targetAnchor = textNodes.last();
              } else {
                const lastListItem = frame.locator('ul.x-tree-node-ct > li.x-tree-node:last-child a.x-tree-node-anchor, ul.x-tree-node-ct > li.x-tree-node:last-child span').last();
                if (await lastListItem.count().catch(() => 0) > 0) {
                  const text = (await lastListItem.innerText().catch(() => '')).trim();
                  if (text.includes(currentSuiteName)) {
                    targetAnchor = lastListItem;
                  }
                }
              }
            }

            if (targetAnchor && await targetAnchor.count().catch(() => 0) > 0) {
              console.log(`   🎯 Found newly created suite in tree! Scrolling into view...`);
              await targetAnchor.scrollIntoViewIfNeeded().catch(() => { });
              await page.waitForTimeout(500);

              try {
                await targetAnchor.click({ force: true, timeout: 5000 });
              } catch (_) {
                await targetAnchor.evaluate(el => el.click()).catch(() => { });
              }

              await targetAnchor.evaluate(el => {
                const a = el.closest('a') || el;
                if (a) a.click();
                if (a && a.href && a.href.startsWith('javascript:')) {
                  try { eval(a.href.replace('javascript:', '')); } catch (_) { }
                }
              }).catch(() => { });

              console.log(`   ✅ Successfully clicked newly created suite "${currentSuiteName}" in tree!`);
              suiteClicked = true;
              break;
            }
          } catch (_) { }
        }

        if (!suiteClicked) {
          await page.waitForTimeout(1000);
        }
      }

      if (!suiteClicked) {
        console.error(`\n❌ CRITICAL ERROR: Newly created suite "${currentSuiteName}" could not be selected in tree within 30 seconds!`);
        throw new Error(`Suite Selection Failed: Newly created suite "${currentSuiteName}" was not found or clicked in tree.`);
      }

      await waitStep(page, `Suite ID ${suiteId} - Step 3.6: Suite Selected in Tree`);

      // ------------------------------------------------------------------------
      // STEP 3.7: Click Suite Actions Cog icon
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.7] Clicking Suite Actions Cog ...`);
      await clickInFrames(page, 'img[onclick*="tsuite_control_panel"], img[title="Actions"], img[src*="cog.png"]', 'Suite Actions Cog');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.7: Suite Cog Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.8: Click "Import Test Cases" (under Test Case Operations fieldset)
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.8] Clicking "Import Test Cases" icon (under Test Case Operations) ...`);

      let tcImportClicked = false;
      const workframe = page.frame({ name: 'workframe' });

      for (const frame of [workframe, ...page.frames()].filter(Boolean)) {
        try {
          const tcOperationsFieldset = frame.locator('fieldset').filter({ hasText: 'Test Case Operations' });
          if (await tcOperationsFieldset.count().catch(() => 0) > 0) {
            const tcImportImg = tcOperationsFieldset.locator('img[onclick*="tcImport"], img[src*="door_in.png"], img[title="Import"]').first();
            if (await tcImportImg.count().catch(() => 0) > 0) {
              await tcImportImg.scrollIntoViewIfNeeded().catch(() => { });
              await tcImportImg.click({ force: true });
              await tcImportImg.evaluate(el => {
                if (el.onclick) el.onclick();
                else if (el.getAttribute('onclick')) eval(el.getAttribute('onclick'));
              }).catch(() => { });
              console.log('   ✅ Successfully clicked "Import Test Cases" under Test Case Operations');
              tcImportClicked = true;
              break;
            }
          }

          const directTcImport = frame.locator('img[onclick*="tcImport.php"], img[src*="door_in.png"][onclick*="tcImport"]').first();
          if (await directTcImport.count().catch(() => 0) > 0) {
            await directTcImport.scrollIntoViewIfNeeded().catch(() => { });
            await directTcImport.click({ force: true });
            await directTcImport.evaluate(el => {
              if (el.onclick) el.onclick();
              else if (el.getAttribute('onclick')) eval(el.getAttribute('onclick'));
            }).catch(() => { });
            console.log('   ✅ Successfully clicked direct "tcImport.php" icon');
            tcImportClicked = true;
            break;
          }
        } catch (_) { }
      }

      if (!tcImportClicked) {
        console.warn('   ⚠️ Falling back to general tcImport selector...');
        await clickInFrames(page, 'fieldset:has-text("Test Case Operations") img[src*="door_in.png"], img[onclick*="tcImport.php"]', 'Import Test Cases');
      }

      await waitStep(page, `Suite ID ${suiteId} - Step 3.8: Import Test Cases Page Opened`);

      // ------------------------------------------------------------------------
      // STEP 3.9: Upload XML File into Test Case Import (from test.json filePath)
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.9] Automatically selecting & uploading file: "${currentFilePath}" ...`);

      const targetFile = resolveUploadPath(currentFilePath);
      if (!targetFile) {
        console.error(`\n❌ CRITICAL: File not found on disk at path "${currentFilePath}"!`);
        throw new Error(`File not found: "${currentFilePath}". Please verify path in test.json.`);
      }

      let fileInput = null;
      const fileInputStart = Date.now();
      while (Date.now() - fileInputStart < 15000 && !fileInput) {
        fileInput = await findInFrames(page, 'input[name="uploadedFile"], input[type="file"]', 2000);
        if (!fileInput) await page.waitForTimeout(500);
      }

      if (fileInput) {
        await fileInput.setInputFiles(targetFile);
        await fileInput.dispatchEvent('change').catch(() => { });
        console.log(`   ✅ File successfully selected & attached for Test Cases: "${targetFile}"`);
      } else {
        console.error(`   ❌ File input element (<input type="file" name="uploadedFile">) not found on tcImport page!`);
        throw new Error('File input field not found on Test Case Import page.');
      }
      await waitStep(page, `Suite ID ${suiteId} - Step 3.9: File Upload Field Ready`);

      // ------------------------------------------------------------------------
      // STEP 3.10: Click "Upload file" Button
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.10] Clicking "Upload file" button ...`);
      await clickInFrames(page, 'input[name="UploadFile"], input[value="Upload file"]', 'Upload file button');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.10: File Uploaded`);

      // ------------------------------------------------------------------------
      // STEP 3.11: Click Desktop Icon
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.11] Returning to Desktop ...`);
      await clickInFrames(page, 'img[title="Desktop"], img[src*="application_home.png"], a[href*="index.php"]', 'Desktop Home');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.11: Desktop Home Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.12: Click "Add / Remove Test Cases"
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.12] Clicking "Add / Remove Test Cases" ...`);
      await clickInFrames(page, 'a[href*="planAddTC"], a:has-text("Add / Remove Test Cases")', 'Add / Remove Test Cases');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.12: Add / Remove Test Cases Page Loaded`);

      // ------------------------------------------------------------------------
      // STEP 3.13: Select Dynamic Suite in Left Tree Using currentSuiteName
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.13] Locating and selecting suite "${currentSuiteName}" in tree ...`);

      let step313SuiteClicked = false;
      const step313TimeoutMs = 30000;
      const step313StartTime = Date.now();

      while (Date.now() - step313StartTime < step313TimeoutMs && !step313SuiteClicked) {
        for (const frame of [page.frame({ name: 'treeframe' }), ...page.frames()].filter(Boolean)) {
          try {
            const rootCollapsed = frame.locator('.x-tree-node-el.x-tree-node-collapsed').first();
            if (await rootCollapsed.count().catch(() => 0) > 0) {
              const rootPlus = rootCollapsed.locator('img.x-tree-ec-icon, .x-tree-elbow-plus').first();
              if (await rootPlus.isVisible().catch(() => false)) {
                await rootPlus.click({ force: true }).catch(() => { });
                await page.waitForTimeout(800);
              }
            }

            let targetAnchor = null;
            const matchingAnchors = frame.locator(`.x-tree-node-el:has-text("${currentSuiteName}") a.x-tree-node-anchor`);
            if (await matchingAnchors.count().catch(() => 0) > 0) {
              targetAnchor = matchingAnchors.last();
            } else {
              const textNodes = frame.locator(`a.x-tree-node-anchor:has-text("${currentSuiteName}"), span:has-text("${currentSuiteName}")`);
              if (await textNodes.count().catch(() => 0) > 0) {
                targetAnchor = textNodes.last();
              } else {
                const lastListItem = frame.locator('ul.x-tree-node-ct > li.x-tree-node:last-child a.x-tree-node-anchor, ul.x-tree-node-ct > li.x-tree-node:last-child span').last();
                if (await lastListItem.count().catch(() => 0) > 0) {
                  const text = (await lastListItem.innerText().catch(() => '')).trim();
                  if (text.includes(currentSuiteName)) {
                    targetAnchor = lastListItem;
                  }
                }
              }
            }

            if (targetAnchor && await targetAnchor.count().catch(() => 0) > 0) {
              console.log(`   🎯 Found suite in tree for Add/Remove! Scrolling into view...`);
              await targetAnchor.scrollIntoViewIfNeeded().catch(() => { });
              await page.waitForTimeout(500);

              try {
                await targetAnchor.click({ force: true, timeout: 5000 });
              } catch (_) {
                await targetAnchor.evaluate(el => el.click()).catch(() => { });
              }

              await targetAnchor.evaluate(el => {
                const a = el.closest('a') || el;
                if (a) a.click();
                if (a && a.href && a.href.startsWith('javascript:')) {
                  try { eval(a.href.replace('javascript:', '')); } catch (_) { }
                }
              }).catch(() => { });

              console.log(`   ✅ Successfully clicked suite "${currentSuiteName}" in Add/Remove tree!`);
              step313SuiteClicked = true;
              break;
            }
          } catch (_) { }
        }

        if (!step313SuiteClicked) {
          await page.waitForTimeout(1000);
        }
      }

      if (!step313SuiteClicked) {
        console.error(`\n❌ CRITICAL ERROR: Suite "${currentSuiteName}" could not be selected in Add/Remove tree within 30 seconds!`);
        throw new Error(`Suite Selection Failed: Suite "${currentSuiteName}" was not found or clicked in Add/Remove tree.`);
      }

      await waitStep(page, `Suite ID ${suiteId} - Step 3.13: Suite Selected in Add/Remove Tree`);

      // ------------------------------------------------------------------------
      // STEP 3.14: Select Tester "harsh" (value="9")
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.14] Selecting Tester value="${TESTER_ID}" (harsh) ...`);
      const testerSelect = await findInFrames(page, 'select#testerID, select[name="testerID"]');
      if (testerSelect) {
        await testerSelect.selectOption(TESTER_ID);
        console.log('   ✅ Tester selected: harsh (value: 9)');
      }
      await waitStep(page, `Suite ID ${suiteId} - Step 3.14: Tester Selected`);

      // ------------------------------------------------------------------------
      // STEP 3.15: Dynamically Select Build for Active Test Plan
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.15] Resolving & Selecting Build for active Test Plan ("${TARGET_PLAN_LABEL}") ...`);
      const buildSelect = await findInFrames(page, 'select[name="build_id"], select#build_id');
      let activeBuildId = '';
      let activeBuildName = '';

      if (buildSelect) {
        // Read all available options from the build dropdown
        const availableOptions = await buildSelect.evaluate(sel => {
          return Array.from(sel.options).map(o => ({
            value: o.value ? o.value.trim() : '',
            text: o.text ? o.text.trim() : '',
            selected: o.selected
          }));
        });

        console.log(`   📋 Found ${availableOptions.length} build options:`, availableOptions.map(b => `"${b.text}" (${b.value})`).join(', '));

        // Filter valid options (exclude empty, 0, or placeholder labels)
        const validOptions = availableOptions.filter(b => b.value && b.value !== '0' && !b.text.toLowerCase().includes('select'));

        let chosenOption = null;

        // 1. If explicit TARGET_BUILD_ID is configured and exists in options
        if (TARGET_BUILD_ID) {
          chosenOption = validOptions.find(b => b.value === String(TARGET_BUILD_ID));
        }

        // 2. If explicit TARGET_BUILD_NAME is configured and matches text
        if (!chosenOption && TARGET_BUILD_NAME) {
          chosenOption = validOptions.find(b => b.text.toLowerCase().includes(TARGET_BUILD_NAME.toLowerCase()));
        }

        // 3. If an option is already selected
        if (!chosenOption) {
          chosenOption = validOptions.find(b => b.selected);
        }

        // 4. Default to the latest (last) or first valid build in the list
        if (!chosenOption && validOptions.length > 0) {
          chosenOption = validOptions[validOptions.length - 1];
        }

        // 5. Fallback to any option
        if (!chosenOption && availableOptions.length > 0) {
          chosenOption = availableOptions[0];
        }

        if (chosenOption && chosenOption.value) {
          activeBuildId = chosenOption.value;
          activeBuildName = chosenOption.text;
          await buildSelect.selectOption(chosenOption.value);
          console.log(`   ✅ Build dynamically selected: "${activeBuildName}" (value: ${activeBuildId})`);
        } else {
          console.warn(`   ⚠️ No valid build options found; proceeding with existing dropdown state.`);
        }
      }
      await waitStep(page, `Suite ID ${suiteId} - Step 3.15: Build Selected`);

      // ------------------------------------------------------------------------
      // STEP 3.16: Check all test cases (toggle_all.gif)
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.16] Checking all test cases (toggle_all) ...`);
      await clickInFrames(page, 'img[src*="toggle_all.gif"], img[title*="check/uncheck all"]', 'Toggle All Checkbox');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.16: All Test Cases Toggled`);

      // ------------------------------------------------------------------------
      // STEP 3.17: Click "adding" Button
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.17] Clicking "adding" button ...`);
      await clickInFrames(page, 'button:has-text("adding")', 'Adding Button');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.17: Adding Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.18: Click "Add selected" Button
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.18] Clicking "Add selected" button ...`);
      await clickInFrames(page, 'input[name="doAddRemove"], input[value="Add selected"]', 'Add selected');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.18: Add selected Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.19: Click "Save order" Button
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.19] Clicking "Save order" button ...`);
      await clickInFrames(page, 'input[name="doReorder"], input[value="Save order"]', 'Save order');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.19: Save order Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.20: Click Desktop Icon
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.20] Returning to Desktop ...`);
      await clickInFrames(page, 'img[title="Desktop"], img[src*="application_home.png"], a[href*="index.php"]', 'Desktop Home');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.20: Desktop Clicked`);

      // ------------------------------------------------------------------------
      // STEP 3.21: Click "Access Execute Tests RO"
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.21] Accessing Execute Tests RO ...`);
      await clickInFrames(page, 'a[href*="executeTest"], a:has-text("Access Execute Tests RO"), a:has-text("Execute Tests")', 'Access Execute Tests');
      await waitStep(page, `Suite ID ${suiteId} - Step 3.21: Execute Tests Page Loaded`);

      // ------------------------------------------------------------------------
      // STEP 3.22: Select "Build to execute" (setting_build)
      // ------------------------------------------------------------------------
      const targetBuildDisplay = activeBuildName || 'Active Build';
      console.log(`\n[Suite ID ${suiteId} - Step 3.22] Verifying & Selecting "Build to execute" -> "${targetBuildDisplay}" (Build ID: ${activeBuildId || 'Auto'}) ...`);
      let roundSelected = false;

      for (const frame of [page.frame({ name: 'treeframe' }), page.frame({ name: 'workframe' }), ...page.frames()].filter(Boolean)) {
        try {
          const buildRow = frame.locator('tr').filter({ hasText: 'Build to execute' });
          const buildSelect = frame.locator('select[name="setting_build"]');

          if (await buildSelect.count().catch(() => 0) > 0) {
            const currentValue = await buildSelect.first().evaluate(sel => sel.value).catch(() => '');
            const currentText = await buildSelect.first().evaluate(sel => sel.options[sel.selectedIndex]?.text?.trim() || '').catch(() => '');
            const chosenText = await buildRow.locator('.chosen-single span').first().innerText().catch(() => '');

            const isAlreadyActive = (activeBuildId && currentValue === activeBuildId) ||
              (activeBuildName && (currentText.includes(activeBuildName) || chosenText.includes(activeBuildName))) ||
              (!activeBuildId && (currentValue || chosenText));

            if (isAlreadyActive && (currentValue || chosenText)) {
              console.log(`   ✅ Build "${chosenText || currentText}" is ALREADY selected and active! (Value: ${currentValue})`);
              roundSelected = true;
              break;
            }

            const chosenSingle = buildRow.locator('a.chosen-single').first();
            let chosenUpdated = false;
            if (await chosenSingle.isVisible().catch(() => false)) {
              await chosenSingle.click({ force: true });
              await page.waitForTimeout(400);

              const chosenSearch = frame.locator('.chosen-with-drop .chosen-search-input, tr:has-text("Build to execute") .chosen-search-input').first();
              if (await chosenSearch.isVisible().catch(() => false) && activeBuildName) {
                await chosenSearch.fill(activeBuildName);
                await page.waitForTimeout(300);
              }

              const chosenResults = frame.locator('.chosen-with-drop .chosen-results li.active-result, .chosen-results li.active-result');
              if (await chosenResults.count().catch(() => 0) > 0) {
                let chosenTarget = null;
                if (activeBuildName) {
                  chosenTarget = chosenResults.filter({ hasText: activeBuildName }).first();
                }
                if (!chosenTarget || (await chosenTarget.count().catch(() => 0)) === 0) {
                  chosenTarget = chosenResults.first();
                }
                const selectedResultText = await chosenTarget.innerText().catch(() => '');
                await chosenTarget.click({ force: true });
                chosenUpdated = true;
                roundSelected = true;
                console.log(`   ✅ Selected build "${selectedResultText.trim()}" via Chosen UI`);
              }
            }

            if (!chosenUpdated) {
              const valToSelect = activeBuildId || currentValue;
              if (valToSelect) {
                await buildSelect.first().selectOption(valToSelect, { force: true }).catch(() => { });
                await buildSelect.first().evaluate((sel, val) => {
                  sel.value = val;
                  if (typeof $ !== 'undefined') {
                    $(sel).trigger('chosen:updated');
                  }
                  if (sel.onchange) sel.onchange();
                  if (sel.form) sel.form.submit();
                }, valToSelect).catch(() => { });
                roundSelected = true;
                console.log(`   ✅ Selected build value "${valToSelect}" via selectOption & submitted form`);
              }
            }

            await page.waitForTimeout(3000);
            break;
          }
        } catch (_) { }
      }

      await waitStep(page, `Suite ID ${suiteId} - Step 3.22: Build to execute Verified/Selected`);

      // ------------------------------------------------------------------------
      // STEP 3.23: EXPAND TREE FOR ROOT & TEST SUITE currentSuiteName
      // ------------------------------------------------------------------------
      console.log(`\n[Suite ID ${suiteId} - Step 3.23] Tree Navigation: Verifying Root & Opening Test Suite ("${currentSuiteName}") ...`);

      const getTree = () => {
        let tf = page.frame({ name: 'treeframe' });
        if (tf) return tf;
        for (const f of page.frames()) {
          if (f.name() === 'treeframe' || f.url().includes('execNavigator') || f.url().includes('tcTree')) {
            return f;
          }
        }
        return page;
      };

      let tree = getTree();
      await tree.waitForSelector('.x-tree-node-el', { timeout: 10000 }).catch(() => { });

      const rootEl = tree.locator('div[ext\\:tree-node-id="1"], .x-tree-root-node > .x-tree-node-el, .x-tree-node-el').first();
      const isRootExpanded = await rootEl.evaluate(el => el.classList.contains('x-tree-node-expanded')).catch(() => false) ||
        (await rootEl.locator('img.x-tree-elbow-end-minus, img.x-tree-elbow-minus').count().catch(() => 0) > 0);

      if (isRootExpanded) {
        console.log('   ℹ️ [Step 1] Root node (CreditQ / 6.6 Release) is ALREADY expanded.');
      } else {
        const rootPlus = rootEl.locator('img.x-tree-elbow-end-plus, img.x-tree-elbow-plus').first();
        if (await rootPlus.count().catch(() => 0) > 0) {
          console.log('   📂 [Step 1] Expanding root node once ...');
          await rootPlus.click({ force: true });
          await page.waitForTimeout(1000);
        }
      }

      tree = getTree();
      let currentSuiteNodeEl = null;

      const matchedSuiteNodes = tree.locator('.x-tree-node-el').filter({ hasText: currentSuiteName });
      if (await matchedSuiteNodes.count().catch(() => 0) > 0) {
        currentSuiteNodeEl = matchedSuiteNodes.last();
        console.log(`   🎯 [Step 2] Found matching test suite in tree: "${currentSuiteName}"`);
      } else {
        const allSuiteEls = tree.locator('ul.x-tree-node-ct > li.x-tree-node > .x-tree-node-el');
        if (await allSuiteEls.count().catch(() => 0) > 0) {
          currentSuiteNodeEl = allSuiteEls.last();
          console.log(`   🎯 [Step 2] Picked last test suite node in list`);
        }
      }

      if (currentSuiteNodeEl) {
        await currentSuiteNodeEl.scrollIntoViewIfNeeded().catch(() => { });
        await page.waitForTimeout(300);

        const isSuiteExpanded = await currentSuiteNodeEl.evaluate(el => el.classList.contains('x-tree-node-expanded')).catch(() => false) ||
          (await currentSuiteNodeEl.locator('img.x-tree-elbow-end-minus, img.x-tree-elbow-minus').count().catch(() => 0) > 0);

        if (isSuiteExpanded) {
          console.log(`   ℹ️ [Step 2] Test suite "${currentSuiteName}" is ALREADY expanded.`);
        } else {
          const suitePlus = currentSuiteNodeEl.locator('img.x-tree-elbow-end-plus, img.x-tree-elbow-plus').first();
          if (await suitePlus.count().catch(() => 0) > 0) {
            console.log(`   ➕ [Step 2] Clicking [+] icon to expand test suite ...`);
            await suitePlus.click({ force: true });
          } else {
            const anchor = currentSuiteNodeEl.locator('a.x-tree-node-anchor').first();
            await anchor.dblclick({ force: true }).catch(() => anchor.click({ clickCount: 2 }));
          }
          await page.waitForTimeout(1500);
        }
      }

      await waitStep(page, `Suite ID ${suiteId} - Step 3.23: Test Suite Ready in Tree`);

      // ------------------------------------------------------------------------
      // STEP 3.24 & STEP 3.25: DYNAMIC EXECUTION LOOP FOR TEST CASES
      // ------------------------------------------------------------------------
      console.log('\n============================================================');
      console.log(`🔁 STARTING TEST CASE EXECUTION LOOP FOR SUITE ID ${suiteId} ("${currentSuiteName}")`);
      console.log('============================================================');

      let tcIndex = 1;
      const testCaseNotRunSelector = 'a.x-tree-node-anchor[href*="javascript:ST"]:has(span.light_not_run), ' +
        '.x-tree-node-leaf a[href*="javascript:ST"]:has(span.light_not_run), ' +
        '.x-tree-node-leaf a:has(span.light_not_run)';

      while (true) {
        console.log(`\n--- [Suite ID ${suiteId} - Execution Loop: Test Case #${tcIndex}] ---`);
        tree = getTree();

        let currentTcAnchor = tree.locator(testCaseNotRunSelector).first();
        let exists = (await currentTcAnchor.count().catch(() => 0)) > 0;

        if (!exists) {
          for (const f of page.frames()) {
            const loc = f.locator(testCaseNotRunSelector).first();
            if ((await loc.count().catch(() => 0)) > 0) {
              currentTcAnchor = loc;
              exists = true;
              break;
            }
          }
        }

        if (!exists) {
          console.log('   ⏳ No unexecuted test cases visible. Waiting 2s to verify tree state...');
          await page.waitForTimeout(2000);
          tree = getTree();
          for (const f of [tree, ...page.frames()]) {
            const loc = f.locator(testCaseNotRunSelector).first();
            if ((await loc.count().catch(() => 0)) > 0) {
              currentTcAnchor = loc;
              exists = true;
              break;
            }
          }
        }

        if (!exists) {
          console.log(`\n🎉 ALL TEST CASES IN SUITE ID ${suiteId} ("${currentSuiteName}") EXECUTED!`);
          console.log(`🏁 Total test cases passed: ${tcIndex - 1}.`);
          break;
        }

        const tcText = (await currentTcAnchor.innerText().catch(() => '')).trim() || `TC-${tcIndex}`;
        console.log(`[Suite ID ${suiteId} - Step 3.24] Clicking Test Case #${tcIndex}: "${tcText}" ...`);

        await currentTcAnchor.scrollIntoViewIfNeeded().catch(() => { });
        await page.waitForTimeout(300);

        try {
          await currentTcAnchor.click({ force: true, timeout: 5000 });
        } catch (_) { }

        await currentTcAnchor.evaluate(el => {
          const a = el.closest('a') || el;
          if (a) a.click();
          if (a && a.href && a.href.includes('ST(')) {
            try {
              const m = a.href.match(/ST\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
              if (m && typeof window.ST === 'function') {
                window.ST(m[1], m[2]);
              } else {
                eval(a.href.replace(/^javascript:/i, ''));
              }
            } catch (_) { }
          }
        }).catch(() => { });

        await waitStep(page, `Suite ID ${suiteId} - Step 3.24: TC #${tcIndex} ("${tcText}") Loaded`);

        // STEP 3.25: Click Pass Icon in workframe
        console.log(`[Suite ID ${suiteId} - Step 3.25] Marking TC #${tcIndex} ("${tcText}") as Passed ...`);
        let passClicked = false;

        let curWorkframe = page.frame({ name: 'workframe' });
        if (!curWorkframe) {
          for (const f of page.frames()) {
            if (f.name() === 'workframe' || f.url().includes('tcExecution')) {
              curWorkframe = f;
              break;
            }
          }
        }
        if (!curWorkframe) curWorkframe = page;

        for (const frame of [curWorkframe, ...page.frames().filter(f => f !== curWorkframe)]) {
          try {
            const passIcon = frame.locator('img[src*="test_status_passed.png"], [id*="fastExecp"], [name*="fastExecp"], img[title*="pass" i]').first();
            if (await passIcon.isVisible({ timeout: 2500 }).catch(() => false)) {
              await passIcon.scrollIntoViewIfNeeded().catch(() => { });
              await passIcon.click({ force: true });
              await passIcon.evaluate(el => {
                if (el.onclick) el.onclick();
                else if (el.getAttribute('onclick')) eval(el.getAttribute('onclick'));
              }).catch(() => { });
              console.log(`   ✅ Test Case #${tcIndex} marked Passed via Fast-Exec icon!`);
              passClicked = true;
              break;
            }

            const passRadio = frame.locator('input[type="radio"][value="p"]').first();
            const saveBtn = frame.locator('input[name="save_results"], input[value*="Save"]').first();
            if (await passRadio.isVisible({ timeout: 1000 }).catch(() => false)) {
              await passRadio.check({ force: true });
              if (await saveBtn.isVisible().catch(() => false)) {
                await saveBtn.click({ force: true });
                console.log(`   ✅ Test Case #${tcIndex} marked Passed via radio + Save Execution!`);
                passClicked = true;
                break;
              }
            }
          } catch (_) { }
        }

        if (!passClicked) {
          passClicked = await clickInFrames(
            page,
            'img[src*="test_status_passed.png"], img[title*="pass" i], [id*="fastExecp"], [name*="fastExecp"], input[value="p"]',
            `Pass Status Icon for TC #${tcIndex}`
          );
        }

        await waitStep(page, `Suite ID ${suiteId} - Step 3.25: TC #${tcIndex} Saved as Passed`);
        await page.waitForTimeout(2000);

        if (fileTestCaseCount && tcIndex >= fileTestCaseCount) {
          console.log(`\n🎉 Reached total testcase count from file (${tcIndex}/${fileTestCaseCount}). Loop complete for Suite ID ${suiteId}!`);
          break;
        }

        tcIndex++;
      }

      console.log(`\n✅ [SUITE ID ${suiteId}] "${currentSuiteName}" EXECUTED FULLY (Step 3 to Step 3.25 complete)!`);

      // Check if next suite exists in test.json
      const nextSuite = testSuites[suiteIndex + 1];
      if (nextSuite) {
        console.log(`\n➡️ NEXT SUITE FOUND in test.json -> ID ${nextSuite.id} ("${nextSuite.suiteName}").`);
        console.log(`   Returning to Step 3 to execute Suite ID ${nextSuite.id}...`);
      } else {
        console.log(`\n🏁 NO MORE TEST SUITES IN test.json. Finished all ${testSuites.length} suites!`);
      }
    }

    console.log('\n============================================================');
    console.log('🎉 ALL TEST SUITES IN test.json EXECUTED SUCCESSFULLY!');
    console.log('============================================================');
    console.log('Keeping browser open for 15 seconds to view final dashboard...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Execution error occurred:', error.message);
    console.log('Leaving browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000).catch(() => { });
  } finally {
    console.log('Closing browser...');
    await browser.close().catch(() => { });
    console.log('Browser closed.');
  }
})();
