const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  const LOGIN_URL = `${APP_URL}/login`;

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Fill login form
    await page.type('#email', 'autotest@example.com');
    await page.type('#password', 'AutoPass123');

    // Submit
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 })
    ]);

    const url = page.url();
    console.log('Current URL after login:', url);

    if (url.includes('/customer/dashboard')) {
      console.log('REDIRECT_OK');
      await browser.close();
      process.exit(0);
    } else {
      console.error('REDIRECT_FAIL');
      await browser.close();
      process.exit(2);
    }
  } catch (err) {
    console.error('TEST_ERROR', err);
    await browser.close();
    process.exit(3);
  }
})();
