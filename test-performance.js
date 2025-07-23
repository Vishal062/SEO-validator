const axios = require('axios');

// Test configuration
const TEST_DOMAIN = 'https://example.com';
const TEST_CONFIGS = [
  { name: 'Basic (1 browser)', concurrency: 1, maxPages: 20 },
  { name: 'Optimized (5 browsers)', concurrency: 5, maxPages: 20 },
  { name: 'Advanced (8 browsers)', concurrency: 8, maxPages: 20 }
];

async function testCrawlerPerformance() {
  console.log('🚀 Testing SEO Crawler Pro Performance\n');
  
  for (const config of TEST_CONFIGS) {
    console.log(`\n📊 Testing: ${config.name}`);
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Start crawl
      const startResponse = await axios.post('http://localhost:3000/api/crawler/start', {
        domain: TEST_DOMAIN,
        maxPages: config.maxPages,
        concurrency: config.concurrency
      });
      
      const { id, estimatedTime } = startResponse.data;
      console.log(`✅ Crawl started with ID: ${id}`);
      console.log(`⏱️  Estimated time: ${estimatedTime} seconds`);
      
      // Poll for progress
      let done = false;
      let totalProcessed = 0;
      let totalFound = 0;
      let pagesPerSecond = 0;
      
      while (!done) {
        const progressResponse = await axios.get(`http://localhost:3000/api/crawler/progress?id=${id}`);
        const { batch, done: crawlDone, stats, performance } = progressResponse.data;
        
        if (stats) {
          totalProcessed = stats.totalProcessed;
          totalFound = stats.totalFound;
          pagesPerSecond = stats.pagesPerSecond;
        }
        
        if (batch && batch.length > 0) {
          console.log(`📄 Processed batch: ${batch.length} pages`);
        }
        
        if (performance) {
          console.log(`⚡ Performance: ${performance.processed}/${performance.batchSize} processed, ${performance.pagesPerSecond?.toFixed(1)} pages/sec`);
        }
        
        done = crawlDone;
        
        if (!done) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      console.log(`\n✅ Crawl completed!`);
      console.log(`⏱️  Total time: ${totalTime.toFixed(1)} seconds`);
      console.log(`📊 Pages processed: ${totalProcessed}`);
      console.log(`🔍 Pages found: ${totalFound}`);
      console.log(`⚡ Average speed: ${pagesPerSecond.toFixed(1)} pages/second`);
      console.log(`📈 Efficiency: ${(totalProcessed / totalTime).toFixed(1)} pages/second (actual)`);
      
    } catch (error) {
      console.error(`❌ Error testing ${config.name}:`, error.response?.data?.error || error.message);
    }
  }
  
  console.log('\n🎯 Performance Test Summary');
  console.log('=' .repeat(50));
  console.log('The optimized crawler should show significant improvements:');
  console.log('• 5-10x faster processing with parallel browsers');
  console.log('• Better resource utilization');
  console.log('• Higher success rates with retry logic');
  console.log('• Real-time performance metrics');
}

// Run the test
if (require.main === module) {
  testCrawlerPerformance().catch(console.error);
}

module.exports = { testCrawlerPerformance }; 