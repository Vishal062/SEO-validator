# Enhanced Datalayer Capture Solution

## Problem Statement

The original implementation had issues capturing all datalayer events, particularly the `gtm.historyChange-v2` event. The main problems were:

1. **Limited Event Detection**: Only waited for specific `gtm.historyChange-v2` event
2. **Short Timeout**: 15-second timeout was insufficient for all events to load
3. **Single Event Dependency**: Relied on one specific event instead of capturing all available events
4. **No User Interaction Simulation**: Didn't trigger events that require user interactions

## Solution Overview

The enhanced solution implements a comprehensive datalayer capture system with the following improvements:

### 1. Enhanced Datalayer Capture Function (`captureDataLayerWithPuppeteer`)

**Location**: `app/api/seo/helpers.ts`

**Key Features**:
- **Multiple Event Detection**: Captures various GTM events (`gtm.historyChange-v2`, `gtm.historyChange`, `gtm.js`, `gtm.dom`, `gtm.load`)
- **Extended Timeout**: 30-second timeout for better event capture
- **User Interaction Simulation**: Automatically simulates scrolling and navigation to trigger events
- **Real-time Monitoring**: Monitors datalayer pushes in real-time
- **Fallback Strategies**: Multiple strategies to ensure event capture

### 2. User Interaction Simulation

The solution automatically simulates user interactions that commonly trigger datalayer events:

```javascript
// Simulate scrolling
await page.evaluate(() => {
  window.scrollTo(0, window.innerHeight / 2);
});

// Simulate navigation (if internal links exist)
const navigationLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href]'));
  return links
    .filter(link => {
      const href = link.getAttribute('href');
      return href && !href.startsWith('http') && !href.startsWith('mailto:');
    })
    .slice(0, 3);
});
```

### 3. Multiple Detection Strategies

The solution uses three strategies to detect datalayer events:

1. **Event-Specific Detection**: Waits for specific GTM events
2. **Real-time Push Monitoring**: Monitors when new events are pushed to datalayer
3. **Length-based Detection**: Detects when datalayer length increases

### 4. Enhanced Browser Configuration

Improved Puppeteer configuration for better performance and compatibility:

```javascript
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
```

## Implementation Details

### Files Modified

1. **`app/api/seo/helpers.ts`**
   - Added `captureDataLayerWithPuppeteer` function
   - Added helper functions for user interaction simulation
   - Added multi-strategy event detection

2. **`app/api/seo/route.ts`**
   - Integrated enhanced datalayer capture
   - Added datalayer data to SEO results

3. **`app/api/snapshot-seo/route.ts`**
   - Updated to use enhanced datalayer capture
   - Improved timeout handling

4. **`app/intelliseo/page.tsx`**
   - Enhanced async datalayer fetching
   - Improved dataLayerAsyncMap handling

### How It Works

1. **Initial Load**: Page loads with datalayer monitoring enabled
2. **User Simulation**: Automatically simulates scrolling and navigation
3. **Event Detection**: Uses multiple strategies to detect datalayer events
4. **Data Capture**: Captures all available datalayer events
5. **Async Updates**: Continues to fetch updated datalayer data asynchronously

## Usage

### In IntelliSEO Page

1. Enter URLs in the input fields
2. Click "SEO Analysis"
3. The system will automatically capture datalayer events
4. View results in the "Analytics" tab of each result

### Testing

Run the test script to verify functionality:

```bash
node test-datalayer.js
```

## Benefits

1. **Comprehensive Event Capture**: Captures all types of datalayer events, not just specific ones
2. **Better Reliability**: Multiple detection strategies ensure events are captured
3. **User Interaction Simulation**: Automatically triggers events that require user interaction
4. **Extended Timeout**: 30-second timeout allows for slower-loading events
5. **Real-time Monitoring**: Monitors datalayer pushes as they happen
6. **Fallback Mechanisms**: Multiple strategies ensure capture even if one fails

## Troubleshooting

### Common Issues

1. **No Events Captured**: 
   - Check if the site has GTM installed
   - Verify the site allows JavaScript execution
   - Check browser console for errors

2. **Timeout Issues**:
   - Increase timeout in `captureDataLayerWithPuppeteer` function
   - Check network connectivity
   - Verify site accessibility

3. **Missing Specific Events**:
   - Some events may require specific user interactions
   - Check if events are triggered by JavaScript errors
   - Verify GTM configuration

### Debug Mode

Enable debug logging by adding console.log statements in the capture function:

```javascript
console.log('Datalayer events found:', dataLayerEvents);
```

## Performance Considerations

- **Timeout**: 30-second timeout may increase processing time
- **Memory Usage**: Capturing all datalayer events may increase memory usage
- **Network**: Multiple requests may impact network performance

## Future Enhancements

1. **Configurable Timeouts**: Allow users to set custom timeouts
2. **Event Filtering**: Allow filtering of specific event types
3. **Custom Interactions**: Allow users to define custom user interactions
4. **Batch Processing**: Process multiple URLs in parallel
5. **Event Analytics**: Provide analytics on captured events 