const fs = require("fs");
const path = require("path");

// Define the cookie folder
const COOKIE_FOLDER = path.resolve(__dirname, "cookies");

// Ensure the folder exists
if (!fs.existsSync(COOKIE_FOLDER)) {
  fs.mkdirSync(COOKIE_FOLDER, { recursive: true });
  console.log(`Created folder: ${COOKIE_FOLDER}`);
}

/**
 * Get the cookie file path for a specific service.
 * @param {string} service - The name of the service (e.g., "linkedin", "facebook").
 * @returns {string} - The full path to the cookie file.
 */
function getCookieFilePath(service) {
  return path.resolve(COOKIE_FOLDER, `${service}_cookies.json`);
}

/**
 * Save cookies to a file with a 4-day expiration time.
 * @param {object} page - The Puppeteer page object.
 * @param {string} service - The name of the service (e.g., "linkedin", "facebook").
 */
async function saveCookies(page, service) {
  const COOKIES_FILE = getCookieFilePath(service);
  const cookies = await page.cookies();
  const expirationTime = new Date();
  expirationTime.setDate(expirationTime.getDate() + 4); // Add 4 days to the current date
  cookies.forEach(cookie => {
    cookie.expires = Math.floor(expirationTime.getTime() / 1000); // Convert to Unix timestamp
  });
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2), "utf-8");
  console.log(`Cookies for ${service} saved with expiration time (4 days).`);
}

/**
 * Load cookies from a file and set them in the page.
 * @param {object} page - The Puppeteer page object.
 * @param {string} service - The name of the service (e.g., "linkedin", "facebook").
 */
async function loadCookies(page, service) {
  const COOKIES_FILE = getCookieFilePath(service);
  if (fs.existsSync(COOKIES_FILE)) {
    // Read the cookies from the file
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, "utf8"));
    for (const cookie of cookies) {
      await page.setCookie(cookie);
    }
    console.log(`Cookies for ${service} loaded.`);
  } else {
    console.log(`No cookies found for ${service}, performing login.`);
  }
}

module.exports = { saveCookies, loadCookies };
