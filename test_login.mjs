import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));

  console.log('Navigating to admin...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });

  console.log('Typing credentials...');
  await page.type('input[type="email"]', 'web.merakiartesano@gmail.com');
  await page.type('input[type="password"]', 'wrongpassword_first');

  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));
  
  const hasSpinner = await page.$eval('button[type="submit"]', el => el.innerHTML.includes('lucide-loader'));
  console.log('Has Spinner?', hasSpinner);
  
  const errorMessage = await page.$eval('form', el => {
      const p = el.querySelector('p');
      return p ? p.innerText : null;
  });
  console.log('Error message on screen:', errorMessage);
  
  await browser.close();
})();
