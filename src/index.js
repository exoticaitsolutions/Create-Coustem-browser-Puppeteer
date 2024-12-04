const express = require("express");
const { log, error } = require("./utils/logger");
const { launchBrowser, closeBrowser } = require("./scraper/browser");
const { scrapeTwitter } = require("./scraper/twitter");
const { scrapeFacebook } = require("./scraper/facebook");
const { scrapeInstagram } = require("./scraper/instagram");
const { scrapeYelp } = require("./scraper/yelp");
const { scrapeVfsglobal } = require("./scraper/vfsglobal");
const { scrapeGeneric } = require("./scraper/generic");
const { scrapeLinkedin } = require("./scraper/linkedin");

const app = express();
const PORT = 3000;

app.use(express.json());

let browser;

// Initialize Puppeteer browser
(async () => {
  browser = await launchBrowser();
})();

// REST API endpoint
app.post("/fetch-page-data", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required in the request body" });
  }

  try {
    let data;

    if (url.includes("twitter.com")) {
      data = await scrapeTwitter(browser, url);
    } else if (url.includes("facebook.com")) {
      data = await scrapeFacebook(browser, url);
    } else if (url.includes("instagram.com")) {
      data = await scrapeInstagram(browser, url);
    } else if (url.includes("yelp.nl")) {
      data = await scrapeYelp(browser, url);
    } else if (url.includes("visa.vfsglobal.com")) {
      data = await scrapeVfsglobal(browser, url);
    } else if (url.includes("linkedin.com")){
      data = await scrapeLinkedin(browser, url);
    }else {
      data = await scrapeGeneric(browser, url);
    }

    res.json({ url, data });
  } catch (err) {
    error(err.message);
    res.status(500).json({ error: "Failed to fetch page data", details: err.message });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  log("Shutting down server...");
  await closeBrowser();
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  log(`Server is running on http://localhost:${PORT}`);
});

