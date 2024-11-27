module.exports = {
  userAgent: {
    status: true,
    list:[
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36", // Google Chrome (Windows 10)
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0", // Mozilla Firefox (Windows 10)
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Safari/537.36", // Apple Safari (macOS)
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // Google Chrome (macOS)
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.864.64 Safari/537.36 Edge/91.0.864.64", // Microsoft Edge (Windows 10)
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL Build/QD5A.200505.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36", // Google Chrome (Android)
      // "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/537.36", // Safari (iPhone)
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.172", // Opera (Windows 10)
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // Google Chrome (Linux)
      // "Mozilla/5.0 (Linux; Android 10; SM-G973F Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/13.0 Chrome/91.0.4472.120 Mobile Safari/537.36", // Samsung Internet (Android)
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0", // Mozilla Firefox (Linux)
      "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; AS; 64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edge/91.0.864.64", // Internet Explorer 11 (Windows 10)
      // "Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36 Edge/91.0.864.64", // Microsoft Edge (Android)
      "Opera/9.80 (Android; Opera Mini/58.0.2254/80.0; U; en) Presto/2.12.423 Version/12.16", // Opera Mini (Android)
      "Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)", // BingBot (Crawler)
      // "Mozilla/5.0 (Linux; Android 7.0; Nexus 5X Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36 Googlebot/2.1 (+http://www.google.com/bot.html)", // Googlebot (Mobile)
      // "Mozilla/5.0 (compatible; Twitterbot/1.0; +http://www.twitter.com)", // Twitterbot (Crawler)
      // "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" // Facebook External Hit (Crawler)
    ]
  },

  proxies: {
    status: true,
    list:[
      "http://51.158.68.26:8811", // France
      "http://185.61.92.227:8080", // Russia
      "http://51.79.50.22:9300", // Canada
      "http://104.248.63.15:8080", // USA
      "http://138.68.24.145:8080", // USA
      "http://38.123.225.98:8080", // USA
      "http://51.79.50.22:9300", // Canada
      "http://164.132.107.74:9300", // France
      "http://51.79.50.22:9300", // Canada
      "http://167.99.24.34:8080", // USA
      "http://103.109.120.173:80", // India
      "http://212.83.182.102:3128", // Germany
      "http://45.32.70.40:8080", // USA
      "http://134.122.58.174:8080", // USA
      "http://66.70.179.248:8080", // Canada
      "http://118.174.233.67:8080", // Thailand
      "http://185.13.39.34:8080", // Poland
      "http://198.50.252.106:8080", // Canada
      "http://192.99.189.163:8080", // Canada
    ]
  },
  
  twitter: {
    loginUrl: "https://twitter.com/login",
    credentials: {
      username: "exoticaltd",
      password: "S5Us3/)pT$.H#yy",
    },
  },

  facebook: {
    credentials: {
      username: "rakeshexoticait@gmail.com",
      password: "Rakesh@123",
    },
  },

  instagram: {
    credentials: {
      username: "rakeshexoticait@gmail.com",
      password: "1996@Rakesh",
    },
  },

  vfsglobal: {
    credentials: {
      username: "harshal@raynatours.com",
      password: "Raynavisa@123",
    }
  },

  // Add headless config
  headless: false, // Change this to false to disable headless mode
};
