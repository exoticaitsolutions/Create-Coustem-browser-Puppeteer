const config = require("../utils/config");
const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Use the stealth plugin
puppeteerExtra.use(StealthPlugin());

// Function to determine which Puppeteer to use
const getPuppeteerInstance = () => {
  try {
    // Try using Puppeteer-extra
    console.log("Trying Puppeteer-extra...");
    return puppeteerExtra;
  } catch (error) {
    console.error("Puppeteer-extra failed, falling back to Puppeteer:", error);
    return puppeteer;
  }
};

const launchBrowser = async () => {
  const puppeteerInstance = getPuppeteerInstance();
  return await puppeteerInstance.launch({
    headless: config.headless, // Read the headless config from the config.js
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox","--start-maximized"],
  });
};

const closeBrowser = async (browser) => {
  if (browser) {
    console.log("Waiting for 10 seconds before closing the browser...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10-second delay
    await browser.close();
  }
};

module.exports = { launchBrowser, closeBrowser };
