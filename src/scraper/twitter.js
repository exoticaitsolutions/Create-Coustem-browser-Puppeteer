
const { log, error } = require("../utils/logger");
const { userAgent, twitter } = require("../utils/config");

const scrapeTwitter = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);

    log("Navigating to Twitter login page...");
    await page.goto(twitter.loginUrl, { waitUntil: "networkidle2" });

    log("Filling in login credentials...");
    await page.type("input[name='text']", twitter.credentials.username, { delay: 100 });
    await page.click("div[data-testid='LoginForm_Login_Button']");
    await page.waitForTimeout(2000); // Adjust timeout if needed

    // Navigate to the Twitter post URL
    log(`Navigating to Twitter URL: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract post details
    const data = await page.evaluate(() => {
      const tweetContent = document.querySelector("article div[lang]")?.innerText || null;
      const author = document.querySelector("div[role='heading'] span")?.innerText || null;
      return { tweetContent, author };
    });

    await page.close();
    return data;
  } catch (err) {
    error("Error scraping Twitter: " + err.message);
    throw err;
  }
};

module.exports = { scrapeTwitter };
