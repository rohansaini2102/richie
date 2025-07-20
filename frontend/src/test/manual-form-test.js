/**
 * Manual Form Testing Guide for ClientOnboardingForm
 * URL: http://localhost:5173/client-onboarding/ab6da2a810ced0585d668ef13cd40aea41290ef8d78ff7de8c104ff044602c01
 * 
 * This script provides guidance for testing the form filling and step 7 submission issue.
 */

// Test Data Sets
const testData = {
  // Complete test data for all 7 steps
  step1: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    maritalStatus: 'single'
  },
  step2: {
    incomeType: 'salaried',
    monthlyIncome: '100000',
    employmentStatus: 'employed',
    profession: 'Software Engineer',
    companyName: 'Tech Corp'
  },
  step3: {
    currentAge: '33',
    retirementAge: '60',
    retirementCorpus: '10000000',
    currentSavings: '500000'
  },
  step4: {
    hasExistingInvestments: 'yes',
    investmentTypes: ['mutual_funds', 'stocks'],
    // CAS file upload - use any PDF file
  },
  step5: {
    hasDebts: 'no',
    // Or if testing with debts:
    // hasDebts: 'yes',
    // debtTypes: ['home_loan'],
    // totalDebtAmount: '2000000'
  },
  step6: {
    hasLifeInsurance: 'yes',
    lifeInsuranceCoverage: '5000000',
    hasHealthInsurance: 'yes'
  },
  step7: {
    emergencyFundPriority: 'high',
    investmentExperience: 'intermediate',
    riskTolerance: 'moderate',
    monthlyInvestmentCapacity: '50000',
    investmentHorizon: '5-10_years',
    investmentGoals: ['retirement', 'wealth_creation']
  }
}

// Console helper functions for testing
window.FormTester = {
  // Function to fill step 1
  fillStep1: () => {
    const data = testData.step1
    document.querySelector('input[name="firstName"]').value = data.firstName
    document.querySelector('input[name="lastName"]').value = data.lastName
    document.querySelector('input[name="email"]').value = data.email
    document.querySelector('input[name="phone"]').value = data.phone
    document.querySelector('input[name="dateOfBirth"]').value = data.dateOfBirth
    
    // Trigger change events
    document.querySelector('input[name="firstName"]').dispatchEvent(new Event('change', { bubbles: true }))
    document.querySelector('input[name="lastName"]').dispatchEvent(new Event('change', { bubbles: true }))
    document.querySelector('input[name="email"]').dispatchEvent(new Event('change', { bubbles: true }))
    document.querySelector('input[name="phone"]').dispatchEvent(new Event('change', { bubbles: true }))
    document.querySelector('input[name="dateOfBirth"]').dispatchEvent(new Event('change', { bubbles: true }))
    
    console.log('✅ Step 1 filled')
  },

  // Function to click Next button
  clickNext: () => {
    const nextButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Next'))
    if (nextButton) {
      nextButton.click()
      console.log('➡️ Clicked Next button')
    } else {
      console.log('❌ Next button not found')
    }
  },

  // Function to check current step
  getCurrentStep: () => {
    const stepText = document.querySelector('.text-sm.text-gray-600')?.textContent
    console.log('📍 Current step:', stepText)
    return stepText
  },

  // Function to check if submit button exists (step 7)
  checkSubmitButton: () => {
    const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Submit') || btn.textContent.includes('Complete')
    )
    if (submitButton) {
      console.log('✅ Submit button found:', submitButton.textContent)
      console.log('🔍 Button disabled?', submitButton.disabled)
      return submitButton
    } else {
      console.log('❌ Submit button not found')
      return null
    }
  },

  // Function to fill all steps quickly (for testing step 7)
  fillAllSteps: async () => {
    console.log('🚀 Starting automated form filling...')
    
    // Step 1
    FormTester.fillStep1()
    await new Promise(resolve => setTimeout(resolve, 500))
    FormTester.clickNext()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 2
    console.log('📝 Filling Step 2...')
    const incomeType = document.querySelector('select[name="incomeType"]')
    if (incomeType) {
      incomeType.value = testData.step2.incomeType
      incomeType.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const monthlyIncome = document.querySelector('input[name="monthlyIncome"]')
    if (monthlyIncome) {
      monthlyIncome.value = testData.step2.monthlyIncome
      monthlyIncome.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    FormTester.clickNext()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Continue with remaining steps...
    console.log('⚠️ Continue manually filling steps 3-7 or implement additional auto-fill functions')
    console.log('🎯 Focus: Test step 7 submission when you reach it')
  },

  // Function to test step 7 specifically
  testStep7Submission: () => {
    console.log('🎯 Testing Step 7 submission...')
    
    // Check if we're on step 7
    const currentStep = FormTester.getCurrentStep()
    if (!currentStep?.includes('7')) {
      console.log('❌ Not on step 7. Current:', currentStep)
      return
    }
    
    // Check for submit button
    const submitButton = FormTester.checkSubmitButton()
    if (!submitButton) {
      console.log('❌ Submit button not found on step 7')
      return
    }
    
    // Fill step 7 fields if empty
    const emergencyFund = document.querySelector('select[name="emergencyFundPriority"]')
    if (emergencyFund && !emergencyFund.value) {
      emergencyFund.value = testData.step7.emergencyFundPriority
      emergencyFund.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    const investmentExp = document.querySelector('select[name="investmentExperience"]')
    if (investmentExp && !investmentExp.value) {
      investmentExp.value = testData.step7.investmentExperience
      investmentExp.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    const riskTolerance = document.querySelector('select[name="riskTolerance"]')
    if (riskTolerance && !riskTolerance.value) {
      riskTolerance.value = testData.step7.riskTolerance
      riskTolerance.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    const monthlyInvestment = document.querySelector('input[name="monthlyInvestmentCapacity"]')
    if (monthlyInvestment && !monthlyInvestment.value) {
      monthlyInvestment.value = testData.step7.monthlyInvestmentCapacity
      monthlyInvestment.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    const investmentHorizon = document.querySelector('select[name="investmentHorizon"]')
    if (investmentHorizon && !investmentHorizon.value) {
      investmentHorizon.value = testData.step7.investmentHorizon
      investmentHorizon.dispatchEvent(new Event('change', { bubbles: true }))
    }
    
    console.log('✅ Step 7 fields filled')
    console.log('🔍 Submit button state:', {
      text: submitButton.textContent,
      disabled: submitButton.disabled,
      className: submitButton.className
    })
    
    // Wait a moment then try to submit
    setTimeout(() => {
      console.log('🚀 Attempting to submit form...')
      submitButton.click()
      
      // Monitor for changes
      setTimeout(() => {
        console.log('📊 Post-submission check:')
        console.log('- Current step:', FormTester.getCurrentStep())
        console.log('- Submit button disabled:', submitButton.disabled)
        console.log('- Any error messages:', document.querySelectorAll('.text-red-500, .text-red-600').length)
      }, 2000)
    }, 1000)
  }
}

// Instructions for manual testing
console.log(`
🧪 FORM TESTING TOOLKIT LOADED!

Use these commands in the browser console:

1. FormTester.getCurrentStep() - Check which step you're on
2. FormTester.fillStep1() - Auto-fill step 1 fields
3. FormTester.clickNext() - Click the Next button
4. FormTester.checkSubmitButton() - Check if submit button exists
5. FormTester.testStep7Submission() - Test step 7 submission
6. FormTester.fillAllSteps() - Auto-fill first few steps

📋 MANUAL TESTING STEPS:

1. Open: http://localhost:5173/client-onboarding/ab6da2a810ced0585d668ef13cd40aea41290ef8d78ff7de8c104ff044602c01
2. Use FormTester.fillStep1() to fill step 1
3. Use FormTester.clickNext() to proceed
4. Repeat for each step or use FormTester.fillAllSteps()
5. When you reach step 7, use FormTester.testStep7Submission()
6. Watch console for detailed feedback

🔍 WHAT TO LOOK FOR:

✅ Form progresses through all 7 steps
✅ Step 7 shows "Submit" button instead of "Next"
✅ Submit button becomes enabled when required fields are filled
✅ Form submits successfully and navigates to dashboard
❌ Form gets stuck at any step
❌ Submit button doesn't appear or doesn't work
❌ Validation errors prevent submission
❌ Network errors during submission

🐛 DEBUGGING TIPS:

- Check browser console for JavaScript errors
- Check Network tab for failed API calls
- Look for validation error messages
- Verify all required fields are filled
- Check button states (enabled/disabled)
`)

export default testData