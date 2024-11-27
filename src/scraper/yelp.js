const { log, error } = require("../utils/logger");
const { userAgent } = require("../utils/config");

const randomUserAgent = userAgent.list?.[Math.floor(Math.random() * userAgent.list.length)];
if (!randomUserAgent) {
  throw new Error("User agent is undefined or empty. Please check the userAgent configuration.");
}

const scrapeYelp = async (browser, url, restaurantName, locationName) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent(randomUserAgent);

    log(`Navigating to Yelp URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Define the restaurant name and location
    const restaurantName = "SAND TRAP BAR & GRILL THE";
    const locationName = "19 CLUBHOUSE DR CHOWCHILLA CA";

    // Wait for the restaurant search input field and enter the restaurant name
    const restaurantInputXPath = '//*[@id="search_description"]';
    await page.waitForXPath(restaurantInputXPath);
    const [restaurantInput] = await page.$x(restaurantInputXPath);
    if (restaurantInput) {
      await restaurantInput.click();
      await page.keyboard.type(restaurantName, { delay: 100 });
      log(`Entered restaurant name: ${restaurantName}`);
    } else {
      throw new Error(`Restaurant search input field not found using XPath: ${restaurantInputXPath}`);
    }

    // Wait for the location search input field and enter the location name
    const locationInputXPath = '//*[@id="search_location"]';
    await page.waitForXPath(locationInputXPath);
    const [locationInput] = await page.$x(locationInputXPath);
    if (locationInput) {
      await locationInput.click();
      await page.keyboard.type(locationName, { delay: 100 });
      log(`Entered location name: ${locationName}`);
    } else {
      throw new Error(`Location search input field not found using XPath: ${locationInputXPath}`);
    }

    // Wait for the search button and click it
    const searchButtonXPath = '//*[@id="header_find_form"]/div[3]/button';
    await page.waitForXPath(searchButtonXPath);
    const [searchButton] = await page.$x(searchButtonXPath);
    if (searchButton) {
      await searchButton.click();
      log("Clicked the search button.");
    } else {
      throw new Error(`Search button not found using XPath: ${searchButtonXPath}`);
    }

    // Optionally wait for search results to load
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    // Extract Yelp data or proceed with additional actions as needed
    const data = await page.evaluate(() => {
      const businessName = document.querySelector("h1")?.innerText || null;
      const rating = document.querySelector("div[aria-label*='rating']")?.getAttribute("aria-label") || null;
      const reviews = document.querySelector("span[class*='reviewCount']")?.innerText || null;

      return { businessName, rating, reviews };
    });

    // Wait for 300ms before closing the page
    await page.waitForTimeout(10000);
    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Yelp: " + err.message);
    throw err;
  }
};

module.exports = { scrapeYelp };
