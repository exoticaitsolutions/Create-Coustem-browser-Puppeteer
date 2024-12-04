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
  const spaMembers = [];
  const imageUrls = []
  const friends = []

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

  log("Selected User Agent: ", randomUserAgent);

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

  // Function to extract links
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

        // const links = await extractLinks(page);
        // console.log(links); // Logs the list of extracted href links

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

        // Example: Scrape data from the profile page
        const data = await page.evaluate(() => {
          const name = document.querySelector('.x78zum5.x15sbx0n.x5oxk1f .x1e56ztr span[dir="auto"]')?.innerText || "No name found";
          const info = document.querySelector('.xieb3on a.x1i10hfl .xt0psk2 span ')?.innerText || "No details found"; // Replace with actual selectors
          return { name, info };
        });

        console.log(`Scraped Data from ${link}:`, data);

        // Define CSV writer
        const outputPath = path.join(__dirname, "facebook_profile_data.csv");
        const csvWriter = createCsvWriter({
          path: outputPath,
          header: [
            { id: "name", title: "Name" },
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
  }

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

    }catch (err) {
      error("Error scraping Facebook: " + err.message);
      throw err;
    }
  }

module.exports = { scrapeFacebook };
