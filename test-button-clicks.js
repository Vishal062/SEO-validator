const puppeteer = require('puppeteer');

// Test button click datalayer capture
async function testButtonClickDataLayer() {
  console.log('Testing button click datalayer capture...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to see what's happening
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
  
  // Enhanced datalayer monitoring
  await page.evaluateOnNewDocument(() => {
    if (typeof window !== 'undefined') {
      // Initialize dataLayer if it doesn't exist
      window.dataLayer = window.dataLayer || [];
      
      // Store original push method
      const originalPush = window.dataLayer.push;
      
      // Override push method to capture all events
      window.dataLayer.push = function(...args) {
        // Call original push method
        const result = originalPush.apply(this, args);
        
        // Mark that we have new events
        window.__dataLayerUpdated = true;
        window.__lastDataLayerUpdate = Date.now();
        
        // Store the event for later retrieval
        if (!window.__capturedEvents) {
          window.__capturedEvents = [];
        }
        window.__capturedEvents.push({
          timestamp: Date.now(),
          event: args[0]
        });
        
        console.log('Datalayer event captured:', args[0]);
        
        return result;
      };
      
      // Also monitor for direct assignments to dataLayer
      Object.defineProperty(window, 'dataLayer', {
        get: function() {
          return window.__dataLayer || [];
        },
        set: function(value) {
          window.__dataLayer = value;
          window.__dataLayerUpdated = true;
          window.__lastDataLayerUpdate = Date.now();
        }
      });
    }
  });

  try {
    // Test with our local test page
    const testUrl = 'http://localhost:8080/test-page.html';
    console.log(`Testing with URL: ${testUrl}`);
    
    // Navigate to the page
    await page.goto(testUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 20000 
    });

    // Wait for initial page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get initial datalayer state
    const initialDataLayerLength = await page.evaluate(() => {
      return window.dataLayer ? window.dataLayer.length : 0;
    });
    
    console.log(`Initial datalayer length: ${initialDataLayerLength}`);

    // Find interactive elements
    const interactiveElements = await page.evaluate(() => {
      const elements = [];
      
      // Find buttons
      document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, [role="button"]').forEach(el => {
        if (el.offsetParent !== null && el.style.display !== 'none' && el.style.visibility !== 'hidden') {
          elements.push({
            type: 'button',
            selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
            text: el.textContent?.trim().substring(0, 50) || '',
            href: el.getAttribute('href') || null
          });
        }
      });
      
      // Find clickable links
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && 
            el.offsetParent !== null && el.style.display !== 'none' && el.style.visibility !== 'hidden') {
          elements.push({
            type: 'link',
            selector: 'a[href="' + href + '"]',
            text: el.textContent?.trim().substring(0, 50) || '',
            href: href
          });
        }
      });
      
      return elements.slice(0, 3); // Limit to first 3 elements
    });

    console.log(`Found ${interactiveElements.length} interactive elements to test:`, interactiveElements);

    // Click on interactive elements to trigger events
    for (const element of interactiveElements) {
      try {
        console.log(`\n--- Testing ${element.type}: ${element.text} ---`);
        
        // Check if element is still visible and clickable
        const isVisible = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          return el && el.offsetParent !== null && el.style.display !== 'none' && el.style.visibility !== 'hidden';
        }, element.selector);
        
        if (isVisible) {
          console.log(`Clicking ${element.type}: ${element.text}`);
          
          // Get datalayer state before click
          const beforeClick = await page.evaluate(() => {
            const dl = window.dataLayer;
            const capturedEvents = window.__capturedEvents || [];
            return {
              dataLayerLength: dl ? dl.length : 0,
              capturedEventsLength: capturedEvents.length
            };
          });
          
          console.log(`Before click - DataLayer: ${beforeClick.dataLayerLength}, Captured: ${beforeClick.capturedEventsLength}`);
          
          // Click the element
          await page.click(element.selector);
          
          // Wait for potential datalayer events
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Get datalayer state after click
          const afterClick = await page.evaluate(() => {
            const dl = window.dataLayer;
            const capturedEvents = window.__capturedEvents || [];
            return {
              dataLayerLength: dl ? dl.length : 0,
              capturedEventsLength: capturedEvents.length,
              capturedEvents: capturedEvents.slice(-3) // Get last 3 events
            };
          });
          
          console.log(`After click - DataLayer: ${afterClick.dataLayerLength}, Captured: ${afterClick.capturedEventsLength}`);
          
          if (afterClick.capturedEventsLength > beforeClick.capturedEventsLength) {
            console.log('New events captured:', afterClick.capturedEvents);
          } else {
            console.log('No new events captured');
          }
          
          // If it's a link, go back
          if (element.type === 'link' && element.href) {
            await page.goBack({ waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log(`Element not visible: ${element.text}`);
        }
      } catch (e) {
        console.log(`Failed to click ${element.type}: ${element.text} - ${e.message}`);
        continue;
      }
    }

    // Capture final datalayer state
    const finalDataLayer = await page.evaluate(() => {
      const dl = window.dataLayer;
      const capturedEvents = window.__capturedEvents || [];
      
      // Combine original dataLayer with captured events
      const allEvents = [...(dl || [])];
      
      // Add any events that might have been captured separately
      capturedEvents.forEach(captured => {
        if (captured.event && !allEvents.some(e => JSON.stringify(e) === JSON.stringify(captured.event))) {
          allEvents.push(captured.event);
        }
      });
      
      return {
        allEvents,
        capturedEvents,
        dataLayerLength: dl ? dl.length : 0,
        capturedEventsLength: capturedEvents.length
      };
    });

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total events: ${finalDataLayer.allEvents.length}`);
    console.log(`DataLayer events: ${finalDataLayer.dataLayerLength}`);
    console.log(`Captured events: ${finalDataLayer.capturedEventsLength}`);
    console.log('\nAll events:');
    finalDataLayer.allEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(event, null, 2)}`);
    });

  } catch (error) {
    console.error('Error capturing datalayer:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

// Run the test
testButtonClickDataLayer().catch(console.error); 