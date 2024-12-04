
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, twitter } = require("../utils/config");
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { saveCookies, loadCookies } = require("../utils/cookie");

puppeteer.use(StealthPlugin());

const TYPING_DELAY = 100; // Delay in milliseconds between simulated keystrokes
const SEARCH_USER = 'narendramodi'; // Name of the user to search on Instagram

const randomUserAgent = userAgent.list?.[Math.floor(Math.random() * userAgent.list.length)];
if (!randomUserAgent) {
  throw new Error("User agent is undefined or empty. Please check the userAgent configuration.");
}

/**
 * Check if an element exists on the page and return it.
 * @param {object} page - The Puppeteer page object.
 * @param {string} selector - The CSS selector to find the element.
 * @param {number} timeout - Timeout in milliseconds to wait for the element.
 * @returns {[boolean, object|null]} - True if element is found, otherwise false, with the element or null.
 */
async function checkedElement(page, selector, timeout = 1000) {
  try {
    await page.waitForSelector(selector, { timeout: timeout });
    console.log(`Element ${selector} found.`);
    const element = await page.$(selector);
    return [true, element];
  } catch (error) {
    console.log(`Element ${selector} not found: ${error.message}`);
    return [false, null];
  }
}

/**
 * Load the given URL and check if the page is valid.
 * @param {object} page - The Puppeteer page object.
 * @param {string} url - The URL to navigate to.
 * @returns {boolean} - True if the page is valid, otherwise false.
 */
const page_load = async (page, url) => {
  let statusValid = true;
  // Listen for the 'response' event to capture the HTTP response status
  page.on('response', (response) => {
    if (response.url() === url) {
      const status = response.status();
      if (status === 404 || status === 403) {
        statusValid = false;
      }
    }
  });

  // Go to the URL and wait for DOM content to load
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return statusValid;
};

const TwitterLoginProcess = async (page) => {
  
}

const scrapeTwitter = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);

    log("Navigating to Twitter login page...");
    await page.goto(twitter.loginUrl, { waitUntil: "networkidle2" });

    log("Filling in login credentials...");
    await page.type("input[name='text']", twitter.credentials.username, { delay: 100 });
    await page.click("div[data-testid='LoginForm_Login_Button']");
    await page.waitForTimeout(2000); // Adjust timeout if needed

    // Navigate to the Twitter post URL
    log(`Navigating to Twitter URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract post details
    const data = await page.evaluate(() => {
      const tweetContent = document.querySelector("article div[lang]")?.innerText || null;
      const author = document.querySelector("div[role='heading'] span")?.innerText || null;
      return { tweetContent, author };
    });

    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Twitter: " + err.message);
    throw err;
  }
};

module.exports = { scrapeTwitter };
