const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, instagram } = require("../utils/config");

puppeteer.use(StealthPlugin());

const randomUserAgent = userAgent.list?.[Math.floor(Math.random() * userAgent.list.length)];
if (!randomUserAgent) {
  throw new Error("User agent is undefined or empty. Please check the userAgent configuration.");
}

const scrapeInstagram = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent(randomUserAgent);

    // Login to Instagram
    log("Navigating to Instagram login page...");
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" });

    log("Filling in login credentials...");
    await page.type('input[name="username"]', instagram.credentials.username, { delay: 100 });
    await page.type('input[name="password"]', instagram.credentials.password, { delay: 100 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    log("Login successful!");

    // Navigate to the target Instagram URL
    log(`Navigating to Instagram URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract post data
    const data = await page.evaluate(() => {
      const username = document.querySelector("header h2")?.innerText || null;
      const postText = document.querySelector("article div[role='button'] span")?.innerText || null;
      return { username, postText };
    });

    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Instagram: " + err.message);
    throw err;
  }
};

module.exports = { scrapeInstagram };
