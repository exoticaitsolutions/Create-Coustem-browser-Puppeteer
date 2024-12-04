const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, instagram } = require("../utils/config");
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

const InstagramLoginProcess = async (page) => {
  try {
    // Wait and type in the username field
    const [usernamestatus, usernameElement] = await checkedElement(page, 'input[name="username"]');
    if (usernamestatus) {
      await usernameElement.type(instagram.credentials.username, { delay: TYPING_DELAY });
      console.log(`Entered username: ${instagram.credentials.username}`);
    }
      // Wait and type in the password field
    const [passwordstatus, passwordElement] = await checkedElement(page, 'input[name="password"]');
    if (passwordstatus) {
      await passwordElement.type(instagram.credentials.password, { delay: TYPING_DELAY });
      console.log('Entered password.');
      await page.waitForTimeout(3000); 
    }
      // Click the login button
    const loginButtonSelector = 'button[type="submit"]';
    const [loginstatus, loginButton] = await checkedElement(page, loginButtonSelector);
    if (loginstatus) {
      await loginButton.click();
      console.log('Login button clicked.');
      await page.waitForTimeout(10000); 
      await saveCookies(page, "instagram");
      // const [isUserLogged, isUserLoggedElement] = await checkedElement(page, 'span[aria-describedby=":Rcrkldd6iuspipd5aq:"]');
      // if (isUserLogged) {
      //   await saveCookies(page, "instagram");
      //   return [true, `Login successful with ${instagram.credentials.username}`];
      // }else{
      //   return [false, `Login failed for ${instagram.credentials.username}`];
      // }
    }else{
      return [false, `Login failed for ${instagram.credentials.username}`];
    }
}catch (error) {
    console.error('Error in login:', error);
    return [false, 'Login failed']; 
}
}

const scrapp_instagram_Profile_Data = async (page, searchUsers) => {
  try {
    const [searchStatus, searchElement] = await checkedElement(page, 'span[aria-describedby=":Rkrkldd6iuspipd5aq:"].x4k7w5x.x1h91t0o .x1n2onr6 a.x1i10hfl.xjbqb8w.x1ejq31n .x9f619.x3nfvp2.xr9ek0c');

    if (searchStatus && searchElement) {
      await searchElement.click();
      console.log('Clicked on search button');
      await page.waitForTimeout(2000); 
      await searchElement.type(searchUsers, { delay: TYPING_DELAY });
      console.log(`Entered username: ${searchUsers}`);
      await page.waitForTimeout(2000);
      
      // Click on the first search result
      const firstLink = await page.$('a[href="/narendramodi/"] > img');
      if (firstLink) {
        await firstLink.click();
        console.log('Clicked on the first search result');
        await page.waitForTimeout(4000);

        const data = await page.evaluate(() => {
          const UserName = document.querySelector("div a h2")?.innerText || "No data";
          const posts = document.querySelector("li:first-child span span")?.innerText || "No data";
          const followers = document.querySelector("li:nth-child(2) span span")?.innerText || "No data";
          const following = document.querySelector("li:nth-child(3) span span")?.innerText || "No data";
          return [{ UserName, posts, followers, following }];
        });
        
        const outputPath = path.join(__dirname, "instagram_scraped_data.csv");
        const csvWriter = createCsvWriter({
          path: outputPath,
          header: [
            { id: "UserName", title: "UserName" },
            { id: "posts", title: "Posts" },
            { id: "followers", title: "Followers" },
            { id: "following", title: "Following" },
          ],
        });
        await csvWriter.writeRecords(data);
        console.log(`Data saved to ${outputPath}`);
        return [true, "Profile data scraped successfully."];

      } else {
        console.error('First search result not found.');
        return [false, 'First search result not found.'];
      }
    } else {
      console.error('Search input not found.');
      return [false, 'Search input not found.'];
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return [false, 'An unexpected error occurred during profile search.'];
  }
}

const scrapeInstagram = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await loadCookies(page, "instagram");
    const login_url = `${url}login`
    isPageValid = await page_load(page, login_url);
    if (isPageValid){
      const[is_user_logged, message ]= await checkedElement(page, 'span[aria-describedby=":Rcrkldd6iuspipd5aq:"]', timeout=10000)
      if (is_user_logged){
        console.log('login ALready via user ')
        const [status, result] = await scrapp_instagram_Profile_Data(page, SEARCH_USER)
        console.log(result);
      }else{
        console.log('Login in processing a')
        const [loginStatus, loginMessage] = await InstagramLoginProcess(page);
          console.log('loginStatus', loginStatus);
          console.log('loginMessage', loginMessage);
        if (loginStatus){
          // await asyncio.sleep(7)
          const [status, result] = await scrapp_instagram_Profile_Data(page, SEARCH_USER)
          console.log('status', status);
          console.log('result', result);
        }           
      }
    }else{
      console.error('Site is not Working')
    }

    await page.waitForTimeout(40000); 
    await page.close();
  } catch (err) {
    error("Error scraping Instagram: " + err.message);
    throw err;
  }
};

module.exports = { scrapeInstagram };
