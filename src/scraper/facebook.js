const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log, error } = require("../utils/logger");
const { userAgent, facebook } = require("../utils/config");
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const startTime = Date.now();
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

    const usernames = ['SPA - Samajwadi Party Uttar Pradesh group'];
    const searchBoxSelector = 'input[type="search"]';
    
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

    const spaMembers = [];
    const imageUrls = []
    const friends = []

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
          await page.waitForTimeout(5000);
        }

        const classSelector = '.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1pd3egz';
        await page.waitForSelector(classSelector);
        await page.click(classSelector);

        await page.waitForTimeout(1000);

        await page.waitForSelector('a.x1i10hfl.xe8uvvx.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.xjyslct.xjbqb8w.x18o3ruo.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1heor9g.x1ypdohk.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.x1vjfegm.x3nfvp2.xrbpyxo.x1itg65n.x16dsc37');

        const elements = await page.$$(
            'a.x1i10hfl.xe8uvvx.xggy1nq.x1o1ewxj.x3x9cwd.x1e5q0jg.x13rtm0m.x87ps6o.x1lku1pv.x1a2a7pz.xjyslct.xjbqb8w.x18o3ruo.x13fuv20.xu3j5b3.x1q0q8m5.x26u7qi.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1heor9g.x1ypdohk.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6.x16tdsg8.x1hl2dhg.x1vjfegm.x3nfvp2.xrbpyxo.x1itg65n.x16dsc37'
        );

        if (elements.length >= 4) {
          await elements[3].click();
        } else {
          log('There are fewer than 3 matching anchor tags');
        }
        await page.waitForTimeout(4000);

        log("Successfully shown members page");

        let groupMembers = [];

        if (username.includes('SPA')) {
        
          groupMembers = await extractMembers("x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1pd3egz");
    
          const membersToAdd = groupMembers.slice(7); 
          spaMembers.push(...membersToAdd);
        } else {
          log("group is not found");
        }
        
        // console.log("group members name ---",spaMembers )
        const length_of_group_member = spaMembers.length

        console.log("Number of group members:", length_of_group_member);

        for (let i = 0; i < Math.min(length_of_group_member, 20); i++) {
          const scrollStep = 5;
          await page.evaluate((step) => {
            const currentPosition = window.scrollY; 
            window.scrollTo(0, currentPosition + step);
          }, scrollStep);
          
          await page.waitForTimeout(10000);

          const member_class = "x1i10hfl xjbqb8w x1ejq31n xd10rxx x1sy0etr x17r0tee x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xt0psk2 xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1a2a7pz x1sur9pj xkrqix3 xzsf02u x1pd3egz";
          await page.waitForSelector(`.${member_class.split(' ').join('.')}`);
          
          const elements = await page.$$( `.${member_class.split(' ').join('.')}` );
      
          if (elements.length > i + 7) { 
            await elements[i + 7].click();
            // console.log(`Successfully clicked on the ${i + 7}th member profile`);
      
            await page.waitForTimeout(10000);
      
            const imageUrl = await page.$eval('svg[style="height: 168px; width: 168px;"] g image', (image) => {
              return image ? image.getAttribute('xlink:href') : null;  
            });
             
            if (imageUrl) {
              imageUrls.push(imageUrl);
              // console.log('Image URL:', imageUrl);
            } else {
              log('No image URL found');
            }

            await page.waitForSelector('span strong'); 

            const numbers = await page.$$eval('span', spans => {
              const result = [];
          
              spans.forEach(span => {
                const strongTag = span.querySelector('strong');
                if (strongTag) {
                  result.push(span.innerText); 
                }
              });
              return result; 
            });
          
            const seventhNumber = numbers[6] || "";
          
            const isFriendFormat = seventhNumber && /^(\d+ friends)$/.test(seventhNumber);
            friends.push(isFriendFormat ? seventhNumber : "No friends");
            // console.log('Friends array:', friends);
            
            await page.waitForTimeout(10000);
      
            const back_btn_class = "x1i10hfl xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x1ypdohk xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x87ps6o x1lku1pv x1a2a7pz x6s0dn4 xzolkzo x12go9s9 x1rnf11y xprq8jg x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x78zum5 xl56j7k xexx8yu x4uap5 x18d9i69 xkhd6sd x1n2onr6 x1vqgdyp x100vrsf x1qhmfi1";
            
            await page.waitForSelector(`.${back_btn_class.split(' ').join('.')}`, { visible: true });
      
            const back_btn = await page.$(`.${back_btn_class.split(' ').join('.')}`);

            if (back_btn) {
              await back_btn.click();
              log("Back button clicked successfully");
              
              await page.waitForTimeout(10000);
            } else {
              console.log("Back button not found!");
            }
            
          } else {
            console.log("Less than 10 elements with the specified class found.");
            break; 
          }
        }
      } catch (err) {
        console.log(`Error searching for username ${username}: ${err.message}`);
      }
    }

    const combinedData = [];

    const maxLength = Math.max(spaMembers.length, imageUrls.length, friends.length);
    for (let i = 0; i < maxLength; i++) {
      combinedData.push({
        'SPA Members': spaMembers[i] || '',
        'Image Urls': imageUrls[i] || '',
        'Friends': friends[i] || '',
      });
    }

    const csvWriter = createCsvWriter({
      path: 'members.csv',
      header: [
        { id: 'SPA Members', title: 'SPA Members' },
        { id: 'Image Urls', title: 'Image Urls' },
        { id: 'Friends', title: 'friends ' }
      ]
    });

    try {
      await csvWriter.writeRecords(combinedData);
      log('CSV file created successfully with members data.');
    } catch (err) {
      console.error(`Error writing CSV file: ${err.message}`);
    } finally {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalTimeInSeconds = (totalTime / 1000).toFixed(2);
      console.log(`Script completed in ${totalTime} ms (${totalTimeInSeconds} seconds).`);
    }

    await page.close();
  } catch (err) {
    error("Error scraping Facebook: " + err.message);
    throw err;
  }
};

module.exports = { scrapeFacebook };
