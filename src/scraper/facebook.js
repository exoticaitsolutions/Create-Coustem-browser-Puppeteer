const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, facebook } = require("../utils/config");

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomUserAgent = userAgent.list?.[Math.floor(Math.random() * userAgent.list.length)];
if (!randomUserAgent) {
  throw new Error("User agent is undefined or empty. Please check the userAgent configuration.");
}

log("Selected User Agent: ", randomUserAgent);

const scrapeFacebook = async (browser, url) => {
  try {
    const page = await browser.newPage();

    // Set the random user agent for the page
    await page.setUserAgent(randomUserAgent);

    // Navigate to Facebook to check if logged in
    log("Checking login status...");
    await page.goto("https://www.facebook.com", { waitUntil: "networkidle2" });

    // Check for a logged-in state (e.g., presence of a profile element)
    const loggedInSelector = 'div[role="navigation"]';
    const isLoggedIn = await page.$(loggedInSelector);

    if (!isLoggedIn) {
      log("Not logged in. Proceeding with login...");
      await page.goto("https://www.facebook.com/login", { waitUntil: "networkidle2" });

      log("Filling in login credentials...");
      await page.type("#email", facebook.credentials.username, { delay: 100 });
      await page.type("#pass", facebook.credentials.password, { delay: 100 });
      await page.click('[name="login"]');
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      log("Login successful!");
    } else {
      log("Already logged in. Skipping login...");
    }

    // Navigate to the target Facebook URL
    log(`Navigating to Facebook URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Define the search term
    const username_search = 'narendramodi';
    const searchBoxSelectors = [
      'input[type="search"]',
    ];

    // Loop through selectors and interact with the first available one
    for (const selector of searchBoxSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        const searchBox = await page.$(selector);
        if (searchBox) {
          await searchBox.click();
          await searchBox.type(username_search, { delay: 200 });
          log(`Typed "${username_search}" in the search box.`);
          break;  // Exit the loop after the first successful interaction
        }
      } catch (err) {
        log(`Selector not found: ${selector}`);
      }
    }

    // Define the XPath expression for clicking
    const xpath = '//*[@id="hc_sts:100044527235621"]/a/div[1]/div[2]';
    try {
      await page.waitForXPath(xpath, { timeout: 5000 });
      const [element] = await page.$x(xpath); 
      if (element) {
        await element.click(); 
        await sleep(1000); 
        log('Element clicked.');
      } else {
        log('Element not found.');
      }
    } catch (err) {
      log('Error waiting for or clicking element: ' + err.message);
    }

    // css_selecter to locate the element by aria-label attribute with 'Verified account'
    const css_selecter = "span.xt0psk2 a span";

    // Wait for the element to be located, visible, and enabled before clicking
    try {
      await page.waitForSelector(css_selecter, { visible: true, timeout: 20000 });
      const element = await page.$(css_selecter);

      if (element) {
        await element.click();
        await sleep(5000);
        await page.screenshot({ path: 'screenshot_on_error.png' });
        log('Element clicked!');
        
      } else {
        log('Verified account element not found.');
      }
    } catch (err) {
      log('Error with verified account element: ' + err.message);
    }

    const selector = 'div.x1n2onr6.x1ja2u2z h1';  
    const data = {};  

    try {
      await page.waitForSelector(selector, { visible: true, timeout: 10000 });
      data.title = await page.$eval(selector, el => el.innerText);
      log('Extracted Text: ', data.title);  
      return data; 
    } catch (err) {
      log('Error waiting for or extracting text from element: ' + err.message);
      // return data;  
    }



    // data = await page.evaluate(() => {
    //   const title = document.querySelector("div.x1n2onr6.x1ja2u2z h1")?.innerText || null;
    //   const likes = document.querySelector("div[aria-label*='likes']")?.innerText || null;
    //   return { title, likes };
    // });

    // Close the page and return the data
    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Facebook: " + err.message);
    throw err;
  }
};

module.exports = { scrapeFacebook };
