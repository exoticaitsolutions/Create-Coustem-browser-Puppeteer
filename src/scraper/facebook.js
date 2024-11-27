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

 
    log(`Navigating to Facebook URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // const usernames = ['BJP - bharatiya janata party', 'rahulgandhi', 'elonmusk', 'viratkohli',]; 
    const usernames = ['BJP - bharatiya janata party group',]; 
    const searchBoxSelector = 'input[type="search"]';

    for (const username of usernames) {
      try {
        log(`Searching for: ${username}`);
        
        await page.waitForSelector(searchBoxSelector, { timeout: 5000 });
        const searchBox = await page.$(searchBoxSelector);
        if (searchBox) {
     
          await searchBox.click();
          await searchBox.type(username, { delay: 200 });
          log(`Typed "${username}" in the search box.`);
          await page.keyboard.press('Enter');
          await sleep(5000); 

          for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Backspace');
          }
          log('Pressed Backspace 10 times.');    
        }

        let newurl = "https://www.facebook.com/groups/811145495753945/members";

        try {
          log(`Navigating to URL: ${newurl}`);

          await page.goto(newurl, { waitUntil: 'networkidle2' });
          
          log(`Successfully navigated to: ${newurl}`);

          const classNames = "x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1pd3egz";
          try {
           
            await page.evaluate(async () => {
              const scrollStep = 2000; 
              const scrollDelay = 400; 
              const maxScrolls = 100;
          
              for (let i = 0; i < maxScrolls; i++) {
                window.scrollBy(0, scrollStep);
                await new Promise(resolve => setTimeout(resolve, scrollDelay)); 
              }
            });
            await sleep(10000);
            const textContents = await page.evaluate((classNames) => {
      
              const selector = `.${classNames.split(" ").join(".")}`;
   
              const elements = document.querySelectorAll(selector);
         
              return Array.from(elements).map(el => el.textContent.trim());
            }, classNames);
          
            if (textContents.length > 0) {
              console.log(`Members:`, textContents);
            } else {
              console.log("No texts found for the given class.");
            }
          } catch (err) {
            console.error(`Error extracting texts: ${err.message}`);
          }
          
        } catch (err) {
          log(`Error navigating to ${newurl}: ${err.message}`);
        }
        await sleep(10000); 

      } catch (err) {
        log(`Error searching for username ${username}: ${err.message}`);
      }
    }

    await page.close();

  } catch (err) {
    error("Error scraping Facebook: " + err.message);
    throw err;
  }
};

module.exports = { scrapeFacebook };
