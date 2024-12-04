const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent } = require("../utils/config");
const fs = require("fs");
const path = require("path");
const randomUserAgent = userAgent.list?.[Math.floor(Math.random() * userAgent.list.length)];

// Define folder and file paths
const COOKIE_FOLDER = path.resolve(__dirname, "cookies");
const COOKIE_FILE = path.resolve(COOKIE_FOLDER, "yelp_cookies.json");

// Ensure the folder exists
if (!fs.existsSync(COOKIE_FOLDER)) {
  fs.mkdirSync(COOKIE_FOLDER, { recursive: true });
  console.log(`Created folder: ${COOKIE_FOLDER}`);
}

// Ensure the cookie file exists (optional, creates an empty JSON file if needed)
if (!fs.existsSync(COOKIE_FILE)) {
  fs.writeFileSync(COOKIE_FILE, JSON.stringify([], null, 2), "utf-8");
  console.log(`Created cookie file: ${COOKIE_FILE}`);
}



if (!randomUserAgent) {
  throw new Error("User agent is undefined or empty. Please check the userAgent configuration.");
}

// Save cookies with a 2-day expiration
const saveCookies = async (cookies) => {
  try {
    // const cookies = await page.cookies();
    const expirationTime = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

    const cookiesWithExpiry = cookies.map((cookie) => ({
      ...cookie,
      expires: expirationTime / 1000, // Puppeteer expects seconds
    }));

    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookiesWithExpiry, null, 2), "utf-8");
    log("Cookies saved successfully with a 2-day expiration.");
  } catch (err) {
    error("Failed to save cookies: " + err.message);
  }
};

// Load cookies from file
const loadCookies = async (page) => {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf-8"));

      for (const cookie of cookies) {
        if (cookie.expires > Date.now() / 1000) {
          await page.setCookie(cookie);
        } else {
          log("Expired cookie detected. Skipping...");
        }
      }

      log("Cookies loaded successfully.");
    } else {
      log("No cookie file found. Proceeding with login...");
    }
  } catch (err) {
    error("Failed to load cookies: " + err.message);
  }
};

puppeteer.use(StealthPlugin()); // Use StealthPlugin to bypass headless detection

const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const scrapeYelp = async (browser, url, restaurantName, locationName) => {
  try {
    const page = await browser.newPage();
    await loadCookies(page);

    // Set a random user-agent and mimicking human browsing behavior
    await page.setUserAgent(randomUserAgent);

    // Set viewport to a random resolution to avoid detection
    await page.setViewport({
      width: Math.floor(Math.random() * (1920 - 1200 + 1) + 1200),
      height: Math.floor(Math.random() * (1080 - 800 + 1) + 800),
      deviceScaleFactor: 1,
    });

    // Intercept requests and block images, fonts, and stylesheets (reduces load time)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    log(`Navigating to Yelp URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for CAPTCHA prompt (in case blocked)
    const captchaXPath = "//h1[contains(text(),'unusual activity')]";
    const captchaDetected = await page.$x(captchaXPath);
    if (captchaDetected.length > 0) {
      throw new Error("CAPTCHA detected! Please handle it manually or use a solver.");
    }

    // Ensure restaurant and location input fields are visible and interactable
    const restaurantInputXPath = '//*[@id="search_description"]';
    await page.waitForXPath(restaurantInputXPath, { timeout: 15000 });
    const [restaurantInput] = await page.$x(restaurantInputXPath);
    if (!restaurantInput) {
      throw new Error("Restaurant search input field not found.");
    }
    
    // Define the restaurant name and location
    // const restaurantName = "SAND TRAP BAR & GRILL THE";
    // const locationName = "19 CLUBHOUSE DR CHOWCHILLA CA";

    const restaurantName = "RIVIERA BAR";
    const locationName = "20 W FIGUEROA ST SANTA BARBARA CA";

    // Enter restaurant name with random delays
    await restaurantInput.click({ delay: randomDelay(100, 300) });
    await page.keyboard.type(restaurantName, { delay: randomDelay(50, 100) });
    log(`Entered restaurant name: ${restaurantName}`);

    // Enter location name
    const locationInputXPath = '//*[@id="search_location"]';
    await page.waitForXPath(locationInputXPath, { timeout: 15000 });
    const [locationInput] = await page.$x(locationInputXPath);
    if (!locationInput) {
      throw new Error("Location search input field not found.");
    }
    await locationInput.click({ delay: randomDelay(100, 300) });
    await page.keyboard.type(locationName, { delay: randomDelay(50, 100) });
    log(`Entered location name: ${locationName}`);

    // Click the search button
    const searchButtonXPath = '//*[@id="header_find_form"]/div[3]/button';
    await page.waitForXPath(searchButtonXPath, { timeout: 15000 });
    const [searchButton] = await page.$x(searchButtonXPath);
    if (!searchButton) {
      throw new Error("Search button not found.");
    }
    await searchButton.click({ delay: randomDelay(100, 300) });
    log("Clicked the search button.");

    // Wait for results to load
    const resultsLoadedXPath = "//div[contains(@class, 'mainContent')]";
    await page.waitForXPath(resultsLoadedXPath, { timeout: 20000 });
    log("Search results page loaded.");
    const resultsLoadedXPath1 = '//*[@id="main-content"]/ul/li[4]/div[1]/div';
    await page.waitForXPath(resultsLoadedXPath1, { timeout: 20000 });

  
    log("final -------------------------------------------")

    // Scrape relevant data from the page
    const data = await page.evaluate(() => {
      const businessName = document.querySelector("h1")?.innerText || null;
      const rating = document.querySelector("div[aria-label*='rating']")?.getAttribute("aria-label") || null;
      const reviews = document.querySelector("span[class*='reviewCount']")?.innerText || null;

      return { businessName, rating, reviews };
    });

    // Save cookies to a JSON file
    const cookies = await page.cookies();
    await saveCookies(cookies);
    log(cookies)

    // Wait before closing the page
    await page.waitForTimeout(randomDelay(5000, 10000));
    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Yelp: " + err.message);
    throw err;
  }
};

module.exports = { scrapeYelp };
