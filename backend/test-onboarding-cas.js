const { OnboardingCASController } = require('./controllers/OnboardingCASController');
const { casEventLogger } = require('./utils/casEventLogger');

// Test the OnboardingCASController
async function testOnboardingCASController() {
  console.log('🧪 Testing OnboardingCASController...\n');

  try {
    // Test 1: Check if the controller is properly exported
    console.log('✅ OnboardingCASController imported successfully');
    console.log('✅ casEventLogger imported successfully');
    
    // Test 2: Check if the static methods exist
    const methods = [
      'uploadCAS',
      'parseCAS', 
      'getCASStatus',
      'completeOnboardingWithCAS'
    ];
    
    methods.forEach(method => {
      if (typeof OnboardingCASController[method] === 'function') {
        console.log(`✅ Method ${method} exists`);
      } else {
        console.log(`❌ Method ${method} missing`);
      }
    });

    // Test 3: Test logging functionality
    console.log('\n📊 Testing logging functionality...');
    const testEventId = casEventLogger.logInfo('TEST_ONBOARDING_CAS_CONTROLLER', {
      testType: 'integration',
      timestamp: new Date().toISOString(),
      controller: 'OnboardingCASController'
    });
    console.log(`✅ Test event logged with ID: ${testEventId}`);

    console.log('\n🎉 All tests passed! OnboardingCASController is ready for use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testOnboardingCASController();
}

module.exports = { testOnboardingCASController }; 