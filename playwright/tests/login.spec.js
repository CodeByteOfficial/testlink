import { test, expect } from '@playwright/test';
import fs from 'fs';

// ============================================================================
// 🎯 USER INPUT VARIABLES (ENTER THESE 2 VALUES BEFORE RUNNING TESTS)
// ============================================================================
const DYNAMIC_SUITE_NAME = 'NEWCQ-4918_Anoop';
const XML_FILE_PATH = String.raw`C:\Users\komal\Downloads\testign\NEWCQ-4918_Anoop.xml`;

// ============================================================================
// ⚙️ FIXED SYSTEM CONFIGURATION
// ============================================================================
const TESTLINK_USER = 'harsh';
const TESTLINK_PASS = '9ZvSgQc466';
const TARGET_PROJECT_VALUE = '1';            // CQ:CreditQ
const TARGET_PLAN_LABEL = '6.6 Release';     // 6.6 Release
const TESTER_ID = '9';                       // harsh
const BUILD_ID = '92';                       // 6.6 Round _1
const DELAY_MS = 8000;

async function findInFrames(page, selector, timeoutMs = 8000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible().catch(() => false)) return loc;
    } catch (_) {}

    for (const frame of page.frames()) {
      try {
        const loc = frame.locator(selector).first();
        if (await loc.isVisible().catch(() => false)) return loc;
      } catch (_) {}
    }
    await page.waitForTimeout(500);
  }
  return null;
}

async function clickInFrames(page, selector, description) {
  console.log(`👉 Finding & Clicking: ${description} ...`);
  const loc = await findInFrames(page, selector);
  if (loc) {
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click({ force: true });
    return true;
  }
  return false;
}

async function clickSuiteInTree(page, suiteName, description = 'Suite in Tree') {
  console.log(`🔍 Locating Dynamic Suite "${suiteName}" for ${description} ...`);
  for (const frame of [page, ...page.frames()]) {
    try {
      const treeNodeEl = frame.locator('.x-tree-node-el').filter({ hasText: suiteName }).last();
      if (await treeNodeEl.isVisible().catch(() => false)) {
        await treeNodeEl.scrollIntoViewIfNeeded().catch(() => {});
        const anchor = treeNodeEl.locator('a.x-tree-node-anchor, span').first();
        if (await anchor.isVisible().catch(() => false)) {
          await anchor.click({ force: true });
        } else {
          await treeNodeEl.click({ force: true });
        }
        return true;
      }
      const candidate = frame.getByText(suiteName, { exact: false }).last();
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.scrollIntoViewIfNeeded().catch(() => {});
        await candidate.click({ force: true });
        return true;
      }
    } catch (_) {}
  }
  const selector = `span:has-text("${suiteName}"), a:has-text("${suiteName}"), [title*="${suiteName}"]`;
  const loc = await findInFrames(page, selector, 6000);
  if (loc) {
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click({ force: true });
    return true;
  }
  return false;
}

async function expandSuiteInTree(page, suiteName) {
  console.log(`🔍 Expanding Dynamic Suite "${suiteName}" in ExtJS tree (+ icon) ...`);
  for (const frame of [page, ...page.frames()]) {
    try {
      const suiteNode = frame.locator('.x-tree-node-el').filter({ hasText: suiteName }).first();
      if (await suiteNode.isVisible().catch(() => false)) {
        await suiteNode.scrollIntoViewIfNeeded().catch(() => {});
        const plusIcon = suiteNode.locator('img.x-tree-ec-icon, .x-tree-elbow-plus, .x-tree-elbow-end-plus, img[class*="elbow-plus"], img[class*="end-plus"]').first();
        if (await plusIcon.isVisible().catch(() => false)) {
          await plusIcon.click({ force: true });
          return true;
        }
        const anchor = suiteNode.locator('a.x-tree-node-anchor, span').first();
        if (await anchor.isVisible().catch(() => false)) {
          await anchor.dblclick({ force: true }).catch(() => anchor.click({ clickCount: 2 }));
          return true;
        }
      }
    } catch (_) {}
  }
  const fallbackPlus = await findInFrames(page, `.x-tree-node-el:has-text("${suiteName}") img.x-tree-ec-icon, .x-tree-elbow-end-plus, .x-tree-elbow-plus`, 4000);
  if (fallbackPlus) {
    await fallbackPlus.click({ force: true });
    return true;
  }
  await clickSuiteInTree(page, suiteName, 'Fallback click');
  return false;
}

function getTestCaseCountFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (filePath.toLowerCase().endsWith('.csv')) {
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

test('TestLink Complete Workflow', async ({ page }) => {
  test.setTimeout(600 * 1000); // 10 minutes timeout for entire flow and execution loop

  const fileTestCaseCount = getTestCaseCountFromFile(XML_FILE_PATH);

  // Step 0: Login
  await page.goto('https://testing.creditq.co.in/login.php');
  await page.waitForTimeout(DELAY_MS);

  const userField = (await findInFrames(page, 'input[name="tl_login"], #tl_login, input[placeholder="Login Name"]')) || page.locator('#tl_login');
  await userField.fill(TESTLINK_USER);
  const passField = (await findInFrames(page, 'input[name="tl_password"], #tl_password, input[placeholder="Password"]')) || page.locator('#tl_password');
  await passField.fill(TESTLINK_PASS);
  const submitBtn = (await findInFrames(page, 'input#tl_login_button, input[name="login_button"], button:has-text("Log in")')) || page.locator('#tl_login_button');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
    submitBtn.click(),
  ]);
  await page.waitForTimeout(DELAY_MS);

  // Step 1: Select Project CQ:CreditQ
  const projectSelect = await findInFrames(page, 'select[name="testproject"]');
  if (projectSelect) await projectSelect.selectOption(TARGET_PROJECT_VALUE);
  await page.waitForTimeout(DELAY_MS);

  // Step 2: Select Plan 6.6 Release
  const directPlan = await findInFrames(page, 'select[name="testplan"]');
  if (directPlan) {
    await directPlan.selectOption({ label: TARGET_PLAN_LABEL }).catch(() => {});
  } else {
    const chosenContainer = await findInFrames(page, '.chosen-container, a.chosen-single');
    if (chosenContainer) {
      await chosenContainer.click();
      const chosenOption = await findInFrames(page, `li.active-result:has-text("${TARGET_PLAN_LABEL}")`);
      if (chosenOption) await chosenOption.click();
    }
  }
  await page.waitForTimeout(DELAY_MS);

  // Step 3.1: Test Specification
  await clickInFrames(page, 'img[title="Test Specification"], img[src*="chart_organisation.png"], a[title*="Test Specification"]', 'Test Specification');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.2: Settings Cog
  await clickInFrames(page, 'img[title="Actions"], img[src*="cog.png"], [onclick*="tproject_control_panel"]', 'Settings Cog');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.3: Plus (+) Icon
  await clickInFrames(page, 'input#new_testsuite, input[name="new_testsuite"], input[src*="add.png"]', 'New Test Suite');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.4: Suite Name (using variable)
  const nameInput = await findInFrames(page, 'input#name, input[name="container_name"]');
  if (nameInput) await nameInput.fill(DYNAMIC_SUITE_NAME);
  await page.waitForTimeout(DELAY_MS);

  // Step 3.5: Save Suite
  await clickInFrames(page, 'input[name="add_testsuite_button"], input[value="Save"]', 'Save');

  // Step 3.6: Dynamic wait & Click newly created suite in tree
  let specNewEntry = null;
  const specStartTime = Date.now();
  while (Date.now() - specStartTime < 30000) {
    for (const frame of page.frames()) {
      const suiteWithZero = frame.locator(`.x-tree-node-el:has-text("${DYNAMIC_SUITE_NAME} (0)") a.x-tree-node-anchor, .x-tree-node-el:has-text("${DYNAMIC_SUITE_NAME} (0)") span`).last();
      if (await suiteWithZero.isVisible().catch(() => false)) {
        specNewEntry = suiteWithZero;
        break;
      }
      const matchingNodes = frame.locator(`.x-tree-node-el:has-text("${DYNAMIC_SUITE_NAME}") a.x-tree-node-anchor, .x-tree-node-el:has-text("${DYNAMIC_SUITE_NAME}") span`);
      if (await matchingNodes.count().catch(() => 0) > 0) {
        const lastEl = matchingNodes.last();
        if (await lastEl.isVisible().catch(() => false)) {
          specNewEntry = lastEl;
          break;
        }
      }
      const lastTreeItem = frame.locator('ul.x-tree-node-ct > li.x-tree-node:last-child .x-tree-node-el').last();
      if (await lastTreeItem.isVisible().catch(() => false)) {
        const text = await lastTreeItem.innerText().catch(() => '');
        if (text.includes(DYNAMIC_SUITE_NAME)) {
          specNewEntry = lastTreeItem.locator('a.x-tree-node-anchor, span').first();
          break;
        }
      }
    }
    if (specNewEntry) break;
    await page.waitForTimeout(250);
  }

  expect(specNewEntry, `Newly created suite "${DYNAMIC_SUITE_NAME}" did not appear in DOM within 30s`).not.toBeNull();
  await specNewEntry.scrollIntoViewIfNeeded().catch(() => {});
  await specNewEntry.click({ force: true });
  await page.waitForTimeout(DELAY_MS);

  // Step 3.7: Suite Actions Cog
  await clickInFrames(page, 'img[onclick*="tsuite_control_panel"], img[title="Actions"], img[src*="cog.png"]', 'Suite Cog');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.8: Import Test Cases (under Test Case Operations fieldset)
  await clickInFrames(page, 'fieldset:has-text("Test Case Operations") img[src*="door_in.png"], img[src*="door_in.png"][onclick*="tcImport"], [onclick*="tcImport.php"]', 'Import Test Cases (tcImport.php)');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.9: Upload File (using variable)
  const fileInput = await findInFrames(page, 'input[name="uploadedFile"], input[type="file"]');
  if (fileInput && fs.existsSync(XML_FILE_PATH)) {
    await fileInput.setInputFiles(XML_FILE_PATH);
    await fileInput.dispatchEvent('change').catch(() => {});
  }
  await page.waitForTimeout(DELAY_MS);

  // Step 3.10: Click Upload
  await clickInFrames(page, 'input[name="UploadFile"], input[value="Upload file"]', 'Upload Button');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.11: Desktop
  await clickInFrames(page, 'img[title="Desktop"], img[src*="application_home.png"]', 'Desktop');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.12: Add / Remove Test Cases
  await clickInFrames(page, 'a[href*="planAddTC"], a:has-text("Add / Remove Test Cases")', 'Add / Remove Test Cases');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.13: Select Suite in Tree (picking last matching testsuite in tree)
  let specSuiteSelected313 = false;
  for (let attempt = 1; attempt <= 15 && !specSuiteSelected313; attempt++) {
    for (const frame of page.frames()) {
      const matchingAnchors = frame.locator(`.x-tree-node-el:has-text("${DYNAMIC_SUITE_NAME}") a.x-tree-node-anchor`);
      if (await matchingAnchors.count().catch(() => 0) > 0) {
        const lastEl = matchingAnchors.last();
        await lastEl.scrollIntoViewIfNeeded().catch(() => {});
        await lastEl.click({ force: true });
        specSuiteSelected313 = true;
        break;
      }
      const lastItem = frame.locator('ul.x-tree-node-ct > li.x-tree-node:last-child a.x-tree-node-anchor').last();
      if (await lastItem.count().catch(() => 0) > 0) {
        const text = await lastItem.innerText().catch(() => '');
        if (text.includes(DYNAMIC_SUITE_NAME)) {
          await lastItem.scrollIntoViewIfNeeded().catch(() => {});
          await lastItem.click({ force: true });
          specSuiteSelected313 = true;
          break;
        }
      }
    }
    if (!specSuiteSelected313) await page.waitForTimeout(1000);
  }
  expect(specSuiteSelected313, `Failed to select suite "${DYNAMIC_SUITE_NAME}" in Add/Remove tree`).toBeTruthy();
  await page.waitForTimeout(DELAY_MS);

  // Step 3.14: Select Tester
  const testerSelect = await findInFrames(page, 'select#testerID, select[name="testerID"]');
  if (testerSelect) await testerSelect.selectOption(TESTER_ID);
  await page.waitForTimeout(DELAY_MS);

  // Step 3.15: Select Build
  const buildSelect = await findInFrames(page, 'select[name="build_id"], select#build_id');
  if (buildSelect) await buildSelect.selectOption(BUILD_ID);
  await page.waitForTimeout(DELAY_MS);

  // Step 3.16: Check All
  await clickInFrames(page, 'img[src*="toggle_all.gif"], img[title*="check/uncheck all"]', 'Toggle All');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.17: Click adding
  await clickInFrames(page, 'button:has-text("adding")', 'Adding');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.18: Add selected
  await clickInFrames(page, 'input[name="doAddRemove"], input[value="Add selected"]', 'Add selected');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.19: Save order
  await clickInFrames(page, 'input[name="doReorder"], input[value="Save order"]', 'Save order');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.20: Desktop
  await clickInFrames(page, 'img[title="Desktop"], img[src*="application_home.png"]', 'Desktop');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.21: Execute Tests
  await clickInFrames(page, 'a[href*="executeTest"], a:has-text("Access Execute Tests RO")', 'Execute Tests');
  await page.waitForTimeout(DELAY_MS);

  // Step 3.22: Select Round 1 (setting_build)
  const execBuild = await findInFrames(page, 'select[name="setting_build"], select[name="build"], select[name*="build"]');
  if (execBuild) {
    const curVal = await execBuild.evaluate(el => el.value).catch(() => '');
    if (curVal !== '92') {
      await execBuild.selectOption('92', { force: true }).catch(() => {});
      await execBuild.evaluate(el => {
        if (el.onchange) el.onchange();
        if (el.form) el.form.submit();
      }).catch(() => {});
    }
  } else {
    await clickInFrames(page, 'tr:has-text("Build to execute") a.chosen-single, span:has-text("6.6 Round _1")', '6.6 Round _1');
  }
  await page.waitForTimeout(DELAY_MS);

  // Step 3.23: Expand Tree for last suite
  await expandSuiteInTree(page, DYNAMIC_SUITE_NAME);
  await page.waitForTimeout(DELAY_MS);

  // Step 3.24 & Step 3.25: EXECUTION LOOP (Repeats for every test case dynamically)
  let tcIndex = 1;
  while (true) {
    const notRunAnchor = await findInFrames(page, 'a.x-tree-node-anchor:has(span.light_not_run), a.x-tree-node-anchor:has(span[title="Not Run"]), span.light_not_run');
    if (!notRunAnchor) {
      console.log('All test cases completed.');
      break;
    }

    await notRunAnchor.scrollIntoViewIfNeeded().catch(() => {});
    await notRunAnchor.click({ force: true });
    await page.waitForTimeout(DELAY_MS);

    await clickInFrames(
      page,
      'img[src*="test_status_passed.png"], img[title*="passed"], [id*="fastExecp"]',
      `Pass Icon for TC #${tcIndex}`
    );
    await page.waitForTimeout(DELAY_MS);

    if (fileTestCaseCount && tcIndex >= fileTestCaseCount) {
      break;
    }
    tcIndex++;
  }
});
