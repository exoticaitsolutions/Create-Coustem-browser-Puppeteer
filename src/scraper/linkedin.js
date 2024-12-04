/**
 * Puppeteer setup with LinkedIn scraping configuration.
 * This script is designed to scrape data from LinkedIn by automating browser actions.
 * It includes stealth capabilities to avoid detection and uses a random user agent
 * for each session to simulate human browsing.
 */

// Import necessary modules
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { error } = require("../utils/logger");
const { userAgent, linkedin } = require("../utils/config");
const { saveCookies, loadCookies } = require("../utils/cookie");

// Constants for script behavior
const TYPING_DELAY = 100; // Delay in milliseconds between simulated keystrokes
const SEARCH_USER = 'Rohitash .'; // Name of the user to search on LinkedIn

// Enable stealth plugin to prevent detection
/**
 * Adds stealth capabilities to Puppeteer to mimic human browsing behavior,
 * such as hiding automation flags in the browser.
 */
puppeteer.use(StealthPlugin());

// Generate a random user-agent string
/**
 * Selects a random user-agent string from a predefined list to simulate a diverse
 * range of browsers and devices. Throws an error if no user-agent is available.
 *
 * @throws {Error} If the userAgent list is empty or undefined.
 */
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

/**
 * Perform LinkedIn login process.
 * @param {object} page - The Puppeteer page object.
 * @returns {[boolean, string, object]} - True if login is successful, along with the status message and user profile element.
 */

const linkedinLoginProcess = async (page) => {
  try {
      // Wait and type in the username field
      const [usernamestatus, usernameElement] = await checkedElement(page, '#username');
      if (usernamestatus) {
        await usernameElement.type(linkedin.credentials.username, { delay: TYPING_DELAY });
        console.log(`Entered username: ${linkedin.credentials.username}`);
      }
        // Wait and type in the password field
      const [passwordstatus, passwordElement] = await checkedElement(page, '#password');
      if (passwordstatus) {
        await passwordElement.type(linkedin.credentials.password, { delay: TYPING_DELAY });
        console.log('Entered password.');
        await page.waitForTimeout(3000); 
      }
        // Click the login button
      const loginButtonSelector = '#organic-div > form > div.login__form_action_container > button';
      const [loginstatus, loginButton] = await checkedElement(page, loginButtonSelector);
      if (loginstatus) {
        await loginButton.click();
        console.log('Login button clicked.');
        await page.waitForTimeout(7000); 
        const [isUserLogged, isUserLoggedElement] = await checkedElement(page, '#ember14');
        if (isUserLogged) {
          await saveCookies(page, "linkedin");
          return [true, `Login successful with ${linkedin.credentials.username}`];
        }else{
          return [false, `Login failed for ${linkedin.credentials.username}`];
        }
      }else{
        return [false, `Login failed for ${linkedin.credentials.username}`];
      }
  }catch (error) {
      console.error('Error in login:', error);
      return [false, 'Login failed'];  // Always return a tuple with 3 elements
  }
}
/**
 * Scrape LinkedIn profile data.
 * @param {object} page - The Puppeteer page object.
 * @param {string} SEARCH_USER - The username to search for.
 * @returns {[boolean, string]} - Status and result message.
 */
async function scrapp_linkedin_Profile_Data(page, SEARCH_USER) {
  try {
    // Ensure the search input is visible and interactable
    const [searchStatus, searchElement] = await checkedElement(page, "#global-nav-typeahead > input");

    if (searchStatus && searchElement) {
      // Type the search query with a delay
      await searchElement.type(SEARCH_USER, { delay: TYPING_DELAY });
      console.log(`Entered username: ${SEARCH_USER}`);

      // Press Enter to start the search
      await searchElement.press('Enter');
      await page.waitForTimeout(2000); // Allow time for results to load

      // Wait for the profile suggestion to appear and click it
      const profileSuggestionClass = 'linked-area.flex-1.cursor-pointer';
      try {
        await page.waitForSelector(`.${profileSuggestionClass}`, { timeout: 60000 });
        await page.click(`.${profileSuggestionClass}`);
        console.log('Clicked on the profile suggestion.');
        await page.waitForTimeout(5000); // Wait for the profile page to load
      } catch (error) {
        console.error('Error finding or clicking the profile suggestion:', error.message);
        return [false, 'Failed to find the profile suggestion.'];
      }

      // Wait for and click the contact popup link
      const contactSelector = '.ember-view.link-without-visited-state.cursor-pointer.text-heading-small.inline-block.break-words';
      try {
        await page.waitForSelector(contactSelector, { timeout: 60000 });
        await page.click(contactSelector);
        console.log('Clicked on the profile link or popup.');

        // Extract the URL and text from the contact link
        const result = await page.evaluate(() => {
          const linkElement = document.querySelector('.mPZllTlahjWgCEOkdGzLaFVaKxKEfuOVITas.t-14 a.link-without-visited-state');
          if (linkElement) {
            return {
              url: linkElement.href,
              text: linkElement.textContent.trim(),
            };
          }
          return { url: null, text: null };
        });

        // Log the result
        console.log('Profile URL:', result.url);
        console.log('Profile Text:', result.text);

        // Close the popup if it appears
        await closePopup(page);

        await page.waitForTimeout(5000); // Wait for additional loading if necessary
      } catch (error) {
        console.error('Error finding or clicking the profile link/popup:', error.message);
        return [false, 'Failed to interact with the contact popup.'];
      }
    } else {
      console.error('Search input not found.');
      return [false, 'Search input not found.'];
    }

    return [true, `Profile search completed for ${SEARCH_USER}`];
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return [false, 'An unexpected error occurred during profile search.'];
  }
}

/**
 * Function to close the popup if a dismiss button is present.
 * @param {object} page - The Puppeteer page object.
 */
async function closePopup(page) {
  try {
    await page.waitForTimeout(10000);
    const dismissButtonSelector = 'button[aria-label="Dismiss"]';
    const isButtonVisible = await page.$(dismissButtonSelector);

    if (isButtonVisible) {
      await page.waitForSelector(dismissButtonSelector, { timeout: 10000 });
      await page.click(dismissButtonSelector);
      console.log('Dismiss button clicked. Popup closed.');
    } else {
      console.log('No dismiss button found.');
    }
  } catch (error) {
    console.error('Error closing the popup:', error.message);
  }
}


/**
 * Main function to scrape LinkedIn.
 * @param {object} browser - The Puppeteer browser instance.
 * @param {string} url - The URL to navigate to.
 */
const scrapeLinkedin = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await loadCookies(page, "linkedin");
    const login_url = `${url}login`
    isPageValid = await page_load(page, login_url);
    if (isPageValid){
      const[is_user_logged, message ]= await checkedElement(page, "#ember14", timeout=10000)
      if (is_user_logged){
        console.log('login ALready via user ')
        const [status, result] = await scrapp_linkedin_Profile_Data(page, SEARCH_USER)
        console.log(result);
      }else{
        console.log('Login in processing a')
        const [loginStatus, loginMessage] = await linkedinLoginProcess(page);
          console.log('loginStatus', loginStatus);
          console.log('loginMessage', loginMessage);
        if (loginStatus){
          // await asyncio.sleep(7)
          const [status, result] = await scrapp_linkedin_Profile_Data(page, SEARCH_USER)
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
    error("Error scraping LinkedIn: " + err.message);
    throw err;
  }
};
module.exports = { scrapeLinkedin };
