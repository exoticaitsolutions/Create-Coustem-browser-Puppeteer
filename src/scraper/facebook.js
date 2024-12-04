/**
 * Script for configuring a Puppeteer instance with enhanced capabilities, 
 * including stealth mode and additional utilities for logging, configuration, 
 * cookie management, and CSV file operations.
 *
 * Imports:
 * - puppeteer-extra: A Puppeteer library with plugin support for extended functionality.
 * - puppeteer-extra-plugin-stealth: A plugin to minimize detection by anti-bot mechanisms.
 * - logger: Utility module providing `log` and `error` functions for logging messages.
 * - config: Module containing configuration settings, including `userAgent` strings and `facebook` specific configurations.
 * - cookie: Utility module for managing browser cookies with `saveCookies` and `loadCookies` functions.
 * - csv-writer: Library for creating and writing data to CSV files (`createObjectCsvWriter`).
 * - fs: Node.js File System module for file-related operations (e.g., read/write).
 * - path: Node.js module for handling and resolving file and directory paths.
 *
 * Functionality:
 * - Initializes Puppeteer with stealth capabilities to bypass anti-bot detection.
 * - Utilizes custom logging for activity and error reporting.
 * - Loads configuration for user agent and Facebook-specific settings.
 * - Manages browser session persistence through saving and loading cookies.
 * - Supports structured data handling and export through CSV files.
 * - Provides file and path utilities for seamless file management.
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, facebook } = require("../utils/config");
const { saveCookies, loadCookies} = require("../utils/cookie")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require("fs");
const path = require("path");


  // Constants for script behavior
  const TYPING_DELAY = 100; // Delay in milliseconds between simulated keystrokes
  const SEARCH_USER = ['SPA - Samajwadi Party Uttar Pradesh group'];

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
 * Automates the login process for Facebook using Puppeteer.
 * 
 * This function enters the username and password, clicks the login button, 
 * waits for the page to load, and checks if the user has successfully logged in. 
 * If successful, cookies are saved for session persistence.
 * 
 * @param {Object} page - The Puppeteer page object representing the current browser page.
 * @returns {Array} - A tuple where the first element is a boolean indicating the login status 
 *                    (true if successful, false if failed), and the second element is a message 
 *                    providing additional details about the login process.
 * 
 * Process:
 * - Waits for the username field to be available and types in the provided username.
 * - Waits for the password field to be available and types in the provided password.
 * - Clicks the login button and waits for the page to load.
 * - Verifies if the login was successful by checking for the presence of a navigation element.
 * - If login is successful, saves the cookies for the session.
 * 
 * Error Handling:
 * - Logs any errors encountered during the process and returns a failure message.
 * 
 * Dependencies:
 * - `checkedElement`: A helper function that waits for an element to be available before interacting with it.
 * - `saveCookies`: A utility function that saves the session cookies after a successful login.
 * - `facebook.credentials.username`: The username for Facebook login.
 * - `facebook.credentials.password`: The password for Facebook login.
 * - `TYPING_DELAY`: A predefined delay for simulating human typing behavior.
 */

  const facebookLoginProcess = async (page) => {
    try{
      // Wait and type in the username field
      const [usernamestatus, usernameElement] = await checkedElement(page, '#email');
      if (usernamestatus) {
        await usernameElement.type(facebook.credentials.username, { delay: TYPING_DELAY });
        console.log(`Entered username: ${facebook.credentials.username}`);
      }

      // Wait and type in the password field
      const [passwordstatus, passwordElement] = await checkedElement(page, '#pass');
      if (passwordstatus) {
        await passwordElement.type(facebook.credentials.password, { delay: TYPING_DELAY });
        console.log('Entered password.');
        await page.waitForTimeout(3000); 
      }

      // Click the login button
      const loginButtonSelector = '[name="login"]';
      const [loginstatus, loginButton] = await checkedElement(page, loginButtonSelector);
      if (loginstatus) {
        await loginButton.click();
        console.log('Login button clicked.');
        await page.waitForTimeout(7000); 
        const [isUserLogged, isUserLoggedElement] = await checkedElement(page, 'div[role="navigation"]');
        if (isUserLogged) {
          await saveCookies(page, "facebook");
          return [true, `Login successful with ${facebook.credentials.username}`];
        }else{
          return [false, `Login failed for ${facebook.credentials.username}`];
        }
      }else{
        return [false, `Login failed for ${facebook.credentials.username}`];
      }
    }catch (error) {
      console.error('Error in login:', error);
      return [false, 'Login failed'];  // Always return a tuple with 3 elements
    }

  }

  /**
 * Extracts unique links from a webpage by scrolling and collecting anchor tags.
 *
 * This function scrolls the page incrementally, waits for the content to load, 
 * and extracts all unique anchor (`<a>`) tags with specific classes. 
 * It uses a Set to store the links, ensuring no duplicates, and returns an array of unique links.
 * 
 * @param {Object} page - The Puppeteer page object representing the current browser page.
 * @returns {Array} - An array of unique links (URLs) extracted from the page.
 * 
 * Process:
 * - Scrolls the page incrementally (default scroll step: 2000 pixels) with a delay between each scroll.
 * - Waits for content to load after scrolling.
 * - Extracts all anchor tags with the class `.x11i5rnm span.xt0psk2 a`.
 * - Adds each extracted link to a Set to ensure uniqueness.
 * - Converts the Set to an array and returns the unique links.
 * 
 * Error Handling:
 * - Logs any errors encountered during the link extraction process and returns an empty array.
 * 
 * Dependencies:
 * - `page.evaluate`: Executes JavaScript code within the browser context to interact with the DOM.
 * - `window.scrollBy`: Scrolls the page by a specified distance.
 * - `Set`: A JavaScript object used to store unique values (to avoid duplicate links).
 */
  const extractLinks = async (page) => {
    try {
      const scrollStep = 2000;
      const scrollDelay = 400;
      const maxScrolls = 100;
      const uniqueLinks = new Set(); // Use a Set to avoid duplicates
  
      for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate((scrollStep) => {
          window.scrollBy(0, scrollStep);
        }, scrollStep);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
      }
  
      await page.waitForTimeout(10000);
  
      const hrefs = await page.evaluate(() => {
        const links = document.querySelectorAll('.x11i5rnm span.xt0psk2 a');
        return Array.from(links).map(link => link.href);
      });
  
      hrefs.forEach(href => uniqueLinks.add(href)); // Add each link to the Set
  
      // Convert the Set back to an array
      const uniqueLinksArray = Array.from(uniqueLinks);
      return uniqueLinksArray;
  
    } catch (err) {
      console.error(`Error extracting links: ${err.message}`);
      return [];
    }
  };

  /**
 * Scrapes Facebook profile data based on a list of search users.
 * 
 * This function automates the process of searching for users on Facebook, 
 * navigating through the platform, and extracting relevant profile data 
 * such as the name, followers, following, and additional details. The data 
 * is saved into a CSV file for further analysis.
 * 
 * @param {Object} page - The Puppeteer page object representing the current browser page.
 * @param {Array} searchUsers - An array of users to search for on Facebook.
 * @throws {Error} - Throws an error if `searchUsers` is not an array.
 * @returns {Array} - A tuple where the first element is a boolean indicating the success of the operation 
 *                    (true if successful, false if failed), and the second element is a message providing details 
 *                    about the process.
 * 
 * Process:
 * - Searches for each user in the `searchUsers` array on Facebook.
 * - Clicks on the corresponding group and navigates to the "People" section.
 * - Extracts links to user profiles that match the specified criteria.
 * - Visits each profile and scrapes data including the name, followers, following, and additional details.
 * - Saves the scraped data to a CSV file (`facebook_profile_data.csv`).
 * 
 * Error Handling:
 * - Logs and returns errors encountered during each search, profile scraping, or data extraction step.
 * 
 * Dependencies:
 * - `checkedElement`: A helper function that waits for an element to be available before interacting with it.
 * - `extractLinks`: A function that extracts all unique links from the page.
 * - `createCsvWriter`: A CSV writer used to save the scraped data.
 * - `log`, `error`: Logging functions for tracking actions and errors.
 * 
 * Notes:
 * - The function expects `searchUsers` to be an array of user names to search for.
 * - It filters out non-Facebook profile links and only saves links that match certain criteria.
 * - CSV output is appended to an existing file if it already exists.
 */
  const scrapp_facebook_Profile_Data = async(page, searchUsers) =>{
    if (!Array.isArray(searchUsers)) {
      throw new Error("searchUsers must be an array");
    }

    const [searchStatus, searchElement] = await checkedElement(page, 'input[type="search"]');
    if (!searchStatus || !searchElement) {
      error("Search input not found.");
      return [false, "Search input not found."];
    }
    
    const profileLinks = []; // To store all extracted profile links

    for (const user of searchUsers) {
      try {
        log(`Searching for: ${user}`);
        await searchElement.click();
        await searchElement.type(user, { delay: 200 });
        await page.keyboard.press("Enter");
        await page.waitForTimeout(5000);
        log(`Search completed for: ${user}`);

        // Wait for the group link to appear before clicking
        const groupLinkSelector = 'a[aria-label="Samajwadi Party Uttar Pradesh"]';
        const groupLink = await page.$(groupLinkSelector);

        if (groupLink) {
          await groupLink.click();
          await page.waitForTimeout(1000); // Wait for the new page to load
          console.log(`Successfully clicked the group link for ${user}`);
        } else {
          console.error(`Group link not found for ${user}`);
        }

        // Wait for the "People" link element to be present on the page using XPath
        const peopleSelector = '.x1ey2m1c a:nth-child(5)';  // Using CSS selector here
        const peopleLink = await page.$(peopleSelector);

        if (peopleLink) {
          await page.waitForSelector(peopleSelector, { visible: true, timeout: 5000 });
          // Click on the "People" link
          await peopleLink.click();
          console.log('Clicked on the "People" link.');
        } else {
          console.error('Element not found: "People" link.');
        }

        // Extract profile links
        const links = await extractLinks(page);
        const filteredLinks = Array.from(new Set(links)).filter(link =>
          link.startsWith('https://www.facebook.com/') &&
          (link.includes('/groups/') || link.includes('neeraj.firozabad'))
        );

        profileLinks.push(...filteredLinks);

      } catch (err) {
        error(`Error searching for user ${user}: ${err.message}`);
      }
    }

    // Open and scrape data from each profile link
    for (const link of profileLinks) {
      try {
        console.log(`Opening link: ${link}`);
        await page.goto(link, { waitUntil: 'networkidle2' });

        const peopleSelector1 = '.xsgj6o6 a.x1i10hfl.xjbqb8w'; // Your CSS selector here
        // Check and interact with the element
        try {
          const peopleLink1 = await page.$(peopleSelector1);
          if (peopleLink1) {
            console.log('Element found. Clicking on it.');
            await peopleLink1.click();
            await page.waitForTimeout(2000); // Wait for interaction
          } else {
            console.warn(`Element not found: "${peopleSelector1}"`);
          }
        } catch (err) {
          console.error(`Error during element interaction: ${err.message}`);
        }

        // Example: Scrape data from the profile page
        const data = await page.evaluate(() => {
          const name = document.querySelector('.x78zum5.x15sbx0n.x5oxk1f .x1e56ztr span[dir="auto"]')?.innerText || "No name found";
          const Followers = document.querySelector('.x9f619 > span > a:nth-child(1)')?.innerText || "No Followers found";
          const Following = document.querySelector('.x9f619 > span > a:nth-child(2)')?.innerText || "No Following found";
          const info = document.querySelector('.xieb3on a.x1i10hfl .xt0psk2 span ')?.innerText || "No details found"; // Replace with actual selectors
          return { name, Followers, Following, info };
        });

        console.log(`Scraped Data from ${link}:`, data);

        // Define CSV writer
        const outputPath = path.join(__dirname, "facebook_profile_data.csv");
        const csvWriter = createCsvWriter({
          path: outputPath,
          header: [
            { id: "name", title: "Name" },
            { id: "Followers", title: "Followers" },
            { id: "Following", title: "Following" },
            { id: "info", title: "Details" },
          ],
          append: fs.existsSync(outputPath), // Append if file exists
        });

        // Write the data to the CSV
        await csvWriter.writeRecords([data]);
        console.log(`Data saved to ${outputPath}`);

      } catch (err) {
        console.error(`Error scraping data from ${link}: ${err.message}`);
      }
    }

    return [true, "Search completed successfully"];
  };

  /**
 * Scrapes data from Facebook by logging in (if necessary) and extracting profile data of specified users.
 * 
 * This function handles the process of logging into Facebook, either by loading cookies for an already logged-in session 
 * or performing a login procedure if needed. Once logged in, it extracts profile data from a list of users and saves it 
 * to a CSV file. The function also checks if the website is functional and handles various error scenarios.
 * 
 * @param {Object} browser - The Puppeteer browser object used to create a new page and interact with the browser.
 * @param {string} url - The base URL of the Facebook site (e.g., `https://www.facebook.com/`).
 * @throws {Error} - Throws an error if the page cannot be loaded, login fails, or scraping encounters issues.
 * @returns {void} - This function does not return a value but logs relevant messages to the console during its execution.
 * 
 * Process:
 * - A new page is created in the browser and cookies are loaded to check if the user is already logged in.
 * - If the page is valid and the user is logged in, it proceeds to scrape the profile data of specified users.
 * - If the user is not logged in, it attempts to log in using the provided credentials and then scrapes the data.
 * - The scraping process involves extracting profile information such as name, followers, following, and other details.
 * 
 * Error Handling:
 * - Logs errors related to page loading, login failures, and scraping issues.
 * 
 * Notes:
 * - The function expects the `SEARCH_USER` variable to be defined, containing the users whose profile data will be scraped.
 * - The `loadCookies`, `checkedElement`, and `facebookLoginProcess` functions are assumed to handle cookie loading, element 
 *   checking, and login respectively.
 * - The `scrapp_facebook_Profile_Data` function is called to perform the profile scraping after login.
 * - A wait time of 40 seconds is included before the page is closed to ensure that scraping completes.
 * 
 * Dependencies:
 * - `loadCookies`: A helper function to load saved cookies for Facebook login.
 * - `checkedElement`: A function to check if an element is available on the page.
 * - `facebookLoginProcess`: A function that handles Facebook login.
 * - `scrapp_facebook_Profile_Data`: A function that scrapes profile data from Facebook.
 * - `SEARCH_USER`: A variable containing the list of users to search for on Facebook.
 */
  const scrapeFacebook = async (browser, url) => {
    try{
      const page = await browser.newPage();
      await loadCookies(page, "facebook");
      const login_url = `${url}login`
      isPageValid = await page_load(page, login_url);
      if (isPageValid){
        const[is_user_logged, message ]= await checkedElement(page, 'div[role="navigation"]', timeout=10000)
        if (is_user_logged){
          console.log('login ALready via user ')
          const [status, result] = await scrapp_facebook_Profile_Data(page, SEARCH_USER)
          console.log(result);
          console.log("status",status);
        }else{
          console.log('Login in processing a')
          const [loginStatus, loginMessage] = await facebookLoginProcess(page);
            console.log('loginStatus', loginStatus);
            console.log('loginMessage', loginMessage);
          if (loginStatus){
            // await asyncio.sleep(7)
            const [status, result] = await scrapp_facebook_Profile_Data(page, SEARCH_USER)
            console.log('status', status);
            console.log('result', result);
          }           
        }
      }else{
        console.error('Site is not Working')
      }
    
      await page.waitForTimeout(40000); 
      await page.close();
    }catch (err) {
      error("Error scraping Facebook: " + err.message);
      throw err;
    }
  }

module.exports = { scrapeFacebook };