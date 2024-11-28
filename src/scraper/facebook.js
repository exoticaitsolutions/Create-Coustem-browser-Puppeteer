const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, facebook } = require("../utils/config");
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;



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


    await page.setUserAgent(randomUserAgent);

    log("Checking login status...");
    await page.goto("https://www.facebook.com", { waitUntil: "networkidle2" });

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

    const usernames = ['SPA - Samajwadi Party Uttar Pradesh group', 'Congress party group'];
    const searchBoxSelector = 'input[type="search"]';
    const spaMembers = [];
    const congressMembers = [];

    const extractMembers = async (classNames) => {
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
        await page.waitForTimeout(10000);

        const textContents = await page.evaluate((classNames) => {
          const selector = `.${classNames.split(" ").join(".")}`;
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => el.textContent.trim());
        }, classNames);

        return textContents;
      } catch (err) {
        console.error(`Error extracting members: ${err.message}`);
        return [];
      }
    };

    for (const username of usernames) {
      try {
        console.log(`Searching for: ${username}`);
        await page.waitForSelector(searchBoxSelector, { timeout: 5000 });
        const searchBox = await page.$(searchBoxSelector);
        if (searchBox) {
          await searchBox.click();
          await searchBox.type(username, { delay: 200 });
          console.log(`Typed "${username}" in the search box.`);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000);
        }

        try {
          const classSelector = '.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1pd3egz';
          await page.waitForSelector(classSelector);
          await page.click(classSelector);
          console.log('Element clicked successfully');
        } catch (error) {
          console.log('Error clicking the element:', error);
        }

        await page.waitForTimeout(1000);

        await page.waitForSelector('a.x1i10hfl.xe8uvvx.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.xjyslct.xjbqb8w.x18o3ruo.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1heor9g.x1ypdohk.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.x1vjfegm.x3nfvp2.xrbpyxo.x1itg65n.x16dsc37');

        const elements = await page.$$(
            'a.x1i10hfl.xe8uvvx.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.xjyslct.xjbqb8w.x18o3ruo.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1heor9g.x1ypdohk.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.x1vjfegm.x3nfvp2.xrbpyxo.x1itg65n.x16dsc37'
        );
        if (elements.length >= 4) {
            await elements[3].click();
        } else {
            console.log('There are fewer than 3 matching anchor tags');
        }  
        await page.waitForTimeout(1000);
        let groupMembers = [];
        if (username.includes('SPA')) {
          groupMembers = await extractMembers("x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1pd3egz");
          spaMembers.push(...groupMembers);
        } else if (username.includes('Congress')) {
          groupMembers = await extractMembers("x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1pd3egz");
          congressMembers.push(...groupMembers);
        }

        await page.waitForTimeout(10000);

      } catch (err) {
        console.log(`Error searching for username ${username}: ${err.message}`);
      }
    }

 
    const combinedData = [];

    const maxLength = Math.max(spaMembers.length, congressMembers.length);
    for (let i = 0; i < maxLength; i++) {
      combinedData.push({
        'SPA Members': spaMembers[i] || '',
        'Congress Members': congressMembers[i] || ''
      });
    }

    const csvWriter = createCsvWriter({
      path: 'members.csv',
      header: [
        { id: 'SPA Members', title: 'SPA Members' },
        { id: 'Congress Members', title: 'Congress Members' }
      ]
    });

    try {
      await csvWriter.writeRecords(combinedData);
      console.log('CSV file created successfully with SPA and Congress members data.');
    } catch (err) {
      console.error(`Error writing CSV file: ${err.message}`);
    }
    await page.close();

  } catch (err) {
    error("Error scraping Facebook: " + err.message);
    throw err;
  }
};

module.exports = { scrapeFacebook };
