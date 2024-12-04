# Puppeteer Scraper

## Overview

This project is a modular web scraping solution using Puppeteer, designed to scrape data from various websites, including:

- **Twitter**
- **Facebook**
- **Instagram**
- **Linkdin**
- **Yelp**
- Generic websites for basic metadata (like page title).

The solution is implemented in Node.js and exposes a REST API to fetch page data from specified URLs. The scraper dynamically identifies the website type and applies the appropriate scraping logic.

## Project Structure

```
puppeteer-scraper/
├── src/
│   ├── index.js              # Entry point of the application
│   ├── scraper/
│   │   ├── browser.js        # Browser management (launch/close)
│   │   ├── twitter.js        # Twitter scraping logic
│   │   ├── facebook.js       # Facebook scraping logic
│   │   ├── instagram.js      # Instagram scraping logic
│   │   ├── yelp.js           # Yelp scraping logic
│   │   ├── generic.js        # Generic scraping logic
│   ├── utils/
│   │   ├── config.js         # Configuration for credentials and settings
│   │   ├── logger.js         # Logging utility
├── package.json              # Dependencies and scripts
├── README.md                 # This file
```

## Prerequisites

1. **Node.js**: Ensure Node.js (v14 or higher) is installed on your system.
2. **Puppeteer**: This project uses Puppeteer, which is included in the dependencies.
3. **Login Credentials**: You need valid login credentials for Twitter, Facebook, and Instagram to scrape these websites.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd puppeteer-scraper
   ```

2. **Install Dependencies**:
   Run the following command to install required packages:
   npm install
   npm install puppeteer express

3. **Update Configuration**:
   Open `src/utils/config.js` and update the login credentials for Twitter, Facebook, and Instagram.

4. **Start the Server**:
   Run the application:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`.


5. **Test each platform**:

## Facebook:
  POST http://localhost:3000/fetch-page-data
  {
    "url": "https://www.facebook.com/somepage"
  }

## Instagram:
  POST http://localhost:3000/fetch-page-data
  {
    "url": "https://www.instagram.com/someprofile"
  }

## Yelp:
  POST http://localhost:3000/fetch-page-data
  {
    "url": "https://www.yelp.com/biz/somebusiness"
  }

## Twitter:
  POST http://localhost:3000/fetch-page-data
  {
    "url": "https://twitter.com/someuser/status/sometweet"
  }

## Notes

- **Website Support**: The scraper currently supports Twitter, Facebook, Instagram, Yelp, and generic websites.
- **Headless Mode**: Puppeteer runs in headless mode for performance. You can modify this in `src/scraper/browser.js`.
