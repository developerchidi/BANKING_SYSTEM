#!/usr/bin/env node

const { InterestCronService } = require('../dist/services/interest-cron.service');

async function testCronJob() {
  console.log('🧪 Testing cron job manually...');
  
  try {
    await InterestCronService.runManualCalculation();
    console.log('✅ Cron job test completed successfully!');
  } catch (error) {
    console.error('❌ Cron job test failed:', error);
  }
}

if (require.main === module) {
  testCronJob();
}
