const puppeteerExtra = require("puppeteer-extra");
const puppeteerExtraPluginStealth = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, vfsglobal } = require("../utils/config");

puppeteerExtra.use(puppeteerExtraPluginStealth());

const scrapeVfsglobal = async (browser, url) => {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(userAgent);

    log("Navigating to VFS Global login page...");
    await page.goto(url, { waitUntil: "networkidle2" });

    log("Waiting for login form elements...");
    await page.waitForSelector(".mat-input-element[formcontrolname='username']", { visible: true, timeout: 10000 });
    await page.waitForSelector("input[formcontrolname='password']", { visible: true, timeout: 10000 });
    await page.waitForSelector(".mat-focus-indicator", { visible: true, timeout: 5000 });

    log("Entering username...");
    await page.type("input[formcontrolname='username']", vfsglobal.credentials.username);
    await page.waitForTimeout(500);  // Adding a slight delay

    // Enter password with delay
    log("Entering password...");
    await page.type("input[formcontrolname='password']", vfsglobal.credentials.password);
    await page.waitForTimeout(500);  // Adding a slight delay

    // Click the login button
    log("Clicking login button...");
    await page.click(".mat-focus-indicator");

    // Wait for the page to load after login
    log("Waiting for the page to load after login...");
    await page.waitForSelector(".dashboard-class-or-element", { timeout: 10000 });

    log("Login successful!");

    // Pause for 10 seconds before continuing
    log("Pausing for 10 seconds...");
    await page.waitForTimeout(10000);

  } catch (err) {
    error("An error occurred during login:", err.message);
    const errorMessage = await page.$(".error-message-selector");
    if (errorMessage) {
      error("Login failed, error message detected.");
    }
    throw err;
  } finally {
    if (page) {
      await page.close();
    }
  }
};

module.exports = { scrapeVfsglobal };
