
const scrapeGeneric = async (browser, url) => {
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract page title
    const data = await page.evaluate(() => ({
      title: document.title,
    }));

    await page.close();
    return data;
  } catch (err) {
    console.error("Error scraping generic page:", err);
    throw err;
  }
};

module.exports = { scrapeGeneric };
