import { TaxCalculatorExample } from './examples/TaxCalculatorExample';
import { validateConfig } from './config/config';

async function main() {
  console.log('🤖 Multi-Agent Tax Calculator');
  console.log('Powered by LangChain with Debate/Ensemble Coordination');
  console.log('=' .repeat(60));

  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }

  console.log('✅ Configuration validated');
  console.log('🚀 Initializing multi-agent system...\n');

  try {
    const taxCalculator = new TaxCalculatorExample();
    await taxCalculator.runExampleScenarios();
    
    console.log('\n🎉 All scenarios completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running tax calculator:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}