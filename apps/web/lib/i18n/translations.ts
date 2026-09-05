// ── apps/web/lib/i18n/translations.ts ──────────────────────────────────
// English base strings with placeholders for Hindi per Section 72 & User Req Q5
// Values are left in English with "// TODO: Hindi translation" comments.

export type SupportedLanguage = 'en' | 'hi';

export const translations = {
  en: {
    nav: {
      goals: 'Goals',
      courses: 'Courses',
      tools: 'Techno-Funda',
      webinars: 'Webinars',
      pricing: 'Pricing',
      login: 'Log In',
      register: 'Get Started',
      dashboard: 'Dashboard',
      billing: 'Billing & Plans',
      logout: 'Log Out',
    },
    common: {
      investNow: 'Invest with Purpose',
      explorePlans: 'Explore Plans',
      guaranteedExecution: '100% AMFI Registered Distributor Partner (ARN-350272)',
      viewDetails: 'View Details',
      continue: 'Continue',
      back: 'Back',
      submit: 'Submit',
      cancel: 'Cancel',
      loading: 'Loading...',
      gstIncluded: 'Includes 18% GST',
      gstExcluded: '+ 18% GST at checkout',
      lifetime: 'Lifetime Access',
      perYear: '/ year',
      recommended: 'Most Popular',
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Start with our free goal-planning tools, or unlock institutional-grade Techno-Funda research and mentorship.',
      enrollNow: 'Enroll Now',
      choosePlan: 'Choose Plan',
      summary: 'Order Summary',
      paySecurely: 'Pay Securely via Razorpay',
      simulatePayment: 'Simulate Mock Payment',
      paymentSuccess: 'Payment Successful!',
      orderConfirmed: 'Your subscription is now active and entitlements are granted.',
    },
    goals: {
      title: 'Goal-Based Wealth Creation',
      subtitle: 'We calculate your exact SIP, asset allocation, and glide path so you reach your life goals stress-free.',
      retirement: 'Retirement (FIRE)',
      childEducation: "Child's Higher Education",
      homePurchase: 'Dream Home',
      wealthCreation: 'Wealth Builder',
      customGoal: 'Custom Goal',
      targetYear: 'Target Horizon (Years)',
      targetAmount: 'Target Corpus (₹)',
      requiredSip: 'Recommended Monthly SIP',
      calculateNow: 'Calculate Allocation',
    },
  },
  hi: {
    nav: {
      goals: 'Goals', // TODO: Hindi translation: लक्ष्य
      courses: 'Courses', // TODO: Hindi translation: कोर्सेज
      tools: 'Techno-Funda', // TODO: Hindi translation: टेक्नो-फंडा टूल्स
      webinars: 'Webinars', // TODO: Hindi translation: वेबिनार
      pricing: 'Pricing', // TODO: Hindi translation: शुल्क / प्लान
      login: 'Log In', // TODO: Hindi translation: लॉग इन
      register: 'Get Started', // TODO: Hindi translation: शुरू करें
      dashboard: 'Dashboard', // TODO: Hindi translation: डैशबोर्ड
      billing: 'Billing & Plans', // TODO: Hindi translation: बिलिंग और प्लान्स
      logout: 'Log Out', // TODO: Hindi translation: लॉग आउट
    },
    common: {
      investNow: 'Invest with Purpose', // TODO: Hindi translation: उद्देश्य के साथ निवेश करें
      explorePlans: 'Explore Plans', // TODO: Hindi translation: प्लान देखें
      guaranteedExecution: '100% AMFI Registered Distributor Partner (ARN-350272)', // TODO: Hindi translation
      viewDetails: 'View Details', // TODO: Hindi translation: विवरण देखें
      continue: 'Continue', // TODO: Hindi translation: आगे बढ़ें
      back: 'Back', // TODO: Hindi translation: पीछे जाएं
      submit: 'Submit', // TODO: Hindi translation: जमा करें
      cancel: 'Cancel', // TODO: Hindi translation: रद्द करें
      loading: 'Loading...', // TODO: Hindi translation: लोड हो रहा है...
      gstIncluded: 'Includes 18% GST', // TODO: Hindi translation: 18% जीएसटी शामिल
      gstExcluded: '+ 18% GST at checkout', // TODO: Hindi translation: चेकआउट पर 18% जीएसटी
      lifetime: 'Lifetime Access', // TODO: Hindi translation: आजीवन एक्सेस
      perYear: '/ year', // TODO: Hindi translation: / वर्ष
      recommended: 'Most Popular', // TODO: Hindi translation: सबसे लोकप्रिय
    },
    pricing: {
      title: 'Simple, Transparent Pricing', // TODO: Hindi translation: सरल और पारदर्शी शुल्क
      subtitle: 'Start with our free goal-planning tools, or unlock institutional-grade Techno-Funda research and mentorship.', // TODO: Hindi translation
      enrollNow: 'Enroll Now', // TODO: Hindi translation: अभी नामांकन करें
      choosePlan: 'Choose Plan', // TODO: Hindi translation: प्लान चुनें
      summary: 'Order Summary', // TODO: Hindi translation: ऑर्डर सारांश
      paySecurely: 'Pay Securely via Razorpay', // TODO: Hindi translation: रेजरपे से सुरक्षित भुगतान करें
      simulatePayment: 'Simulate Mock Payment', // TODO: Hindi translation: मॉक भुगतान करें
      paymentSuccess: 'Payment Successful!', // TODO: Hindi translation: भुगतान सफल रहा!
      orderConfirmed: 'Your subscription is now active and entitlements are granted.', // TODO: Hindi translation
    },
    goals: {
      title: 'Goal-Based Wealth Creation', // TODO: Hindi translation: लक्ष्य आधारित धन निर्माण
      subtitle: 'We calculate your exact SIP, asset allocation, and glide path so you reach your life goals stress-free.', // TODO: Hindi translation
      retirement: 'Retirement (FIRE)', // TODO: Hindi translation: रिटायरमेंट (FIRE)
      childEducation: "Child's Higher Education", // TODO: Hindi translation: बच्चे की उच्च शिक्षा
      homePurchase: 'Dream Home', // TODO: Hindi translation: सपनों का घर
      wealthCreation: 'Wealth Builder', // TODO: Hindi translation: वेल्थ बिल्डर
      customGoal: 'Custom Goal', // TODO: Hindi translation: अपना लक्ष्य
      targetYear: 'Target Horizon (Years)', // TODO: Hindi translation: लक्ष्य अवधि (वर्ष)
      targetAmount: 'Target Corpus (₹)', // TODO: Hindi translation: लक्ष्य राशि (₹)
      requiredSip: 'Recommended Monthly SIP', // TODO: Hindi translation: अनुशंसित मासिक SIP
      calculateNow: 'Calculate Allocation', // TODO: Hindi translation: आवंटन की गणना करें
    },
  },
};
