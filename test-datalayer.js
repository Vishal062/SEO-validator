const puppeteer = require('puppeteer');

// Test the enhanced datalayer capture function
async function testDataLayerCapture() {
  console.log('Testing enhanced datalayer capture...');
  
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ] 
  });
  
  const page = await browser.newPage();
  
  // Set up datalayer monitoring
  let dataLayerEvents = [];
  let initialDataLayerLength = 0;
  
  // Listen for datalayer pushes
  await page.evaluateOnNewDocument(() => {
    if (typeof window !== 'undefined') {
      const originalPush = window.dataLayer?.push || function() {};
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push = function(...args) {
        originalPush.apply(this, args);
        // Mark that we have new events
        window.__dataLayerUpdated = true;
      };
    }
  });

  try {
    // Test with a site that has GTM
    const testUrl = 'https://www.google.com';
    console.log(`Testing with URL: ${testUrl}`);
    
    // Navigate to the page
    await page.goto(testUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 20000 
    });

    // Wait for initial page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get initial datalayer state
    initialDataLayerLength = await page.evaluate(() => {
      return window.dataLayer ? window.dataLayer.length : 0;
    });
    
    console.log(`Initial datalayer length: ${initialDataLayerLength}`);

    // Simulate user interactions to trigger more events
    console.log('Simulating user interactions...');
    
    // Try to trigger scroll events
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wait for datalayer events
    console.log('Waiting for datalayer events...');
    const startTime = Date.now();
    const maxWaitTime = 15000;
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check for various GTM events
        const hasEvents = await page.evaluate((initialLength) => {
          const dl = window.dataLayer;
          if (!dl || dl.length <= initialLength) return false;
          
          // Check for various GTM events
          const hasHistoryEvent = dl.some((e) => 
            e.event === 'gtm.historyChange-v2' || 
            e.event === 'gtm.historyChange' ||
            e.event === 'gtm.js' ||
            e.event === 'gtm.dom' ||
            e.event === 'gtm.load'
          );
          
          // Check for custom events
          const hasCustomEvents = dl.some((e) => 
            e.event && typeof e.event === 'string' && e.event.length > 0
          );
          
          return hasHistoryEvent || hasCustomEvents || dl.length > initialLength + 2;
        }, initialDataLayerLength);

        if (hasEvents) {
          console.log('Datalayer events detected!');
          break;
        }

        // Wait for dataLayer updates
        await page.waitForFunction(
          'window.__dataLayerUpdated === true',
          { timeout: 3000 }
        ).catch(() => {});

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Capture final datalayer state
    dataLayerEvents = await page.evaluate(() => {
      const dl = window.dataLayer;
      return dl ? JSON.parse(JSON.stringify(dl)) : [];
    });

    console.log(`Final datalayer length: ${dataLayerEvents.length}`);
    console.log('Datalayer events found:');
    dataLayerEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(event, null, 2)}`);
    });

  } catch (error) {
    console.error('Error capturing datalayer:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDataLayerCapture().catch(console.error); 