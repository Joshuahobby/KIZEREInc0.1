/**
 * English language translations
 */
export default {
  // Global
  app_name: 'KIZERE',
  app_tagline: 'Found it. Recover it.',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  save: 'Save',
  cancel: 'Cancel',
  submit: 'Submit',
  continue: 'Continue',
  back: 'Back',
  edit: 'Edit',
  delete: 'Delete',
  view: 'View',
  search: 'Search',
  filter: 'Filter',
  all: 'All',
  ok: 'OK',
  yes: 'Yes',
  no: 'No',
  
  // Auth
  login: 'Login',
  login_with_google: 'Login with Google',
  signup: 'Sign Up',
  logout: 'Logout',
  email: 'Email',
  password: 'Password',
  forgot_password: 'Forgot Password?',
  reset_password: 'Reset Password',
  confirm_password: 'Confirm Password',
  
  // No duplicate keys here
  
  // Navigation - Flat (for backward compatibility)
  nav_home: 'Home',
  nav_dashboard: 'Dashboard',
  nav_items: 'Items',
  nav_reports: 'Reports',
  nav_profile: 'Profile',
  nav_settings: 'Settings',
  nav_help: 'Help',
  nav_register_item: 'Register Item',
  nav_report_lost: 'Report Lost',
  nav_report_found: 'Report Found',

  // Header Navigation - Nested (for new implementation)
  nav: {
    home: 'Home',
    features: 'Features',
    about: 'About',
    contact: 'Contact',
    register: 'Register Items',
    registerItems: 'Register Items',
    search: 'Search Items',
    lostFound: 'Lost & Found',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    navigation: 'Navigation',
    account: 'Account',
    userManagement: 'User Management'
  },
  
  // Dashboard
  dashboard_title: 'Dashboard',
  dashboard_welcome: 'Welcome back',
  dashboard_items_registered: 'Items Registered',
  dashboard_items_recovered: 'Items Recovered',
  dashboard_items_lost: 'Items Lost',
  dashboard_latest_items: 'Latest Items',
  dashboard_recent_activity: 'Recent Activity',
  dashboard_statistics: 'Statistics',
  dashboard_revenue: 'Revenue',
  dashboard_notifications: 'Notifications',
  dashboard_quick_actions: 'Quick Actions',
  dashboard_no_items: 'No items registered yet',
  dashboard_no_reports: 'No reports yet',
  dashboard_no_notifications: 'No notifications',
  
  // Dashboard nested structure
  dashboard: {
    welcomeMessage: 'Welcome back, {name}',
    subtitles: {
      user: 'Manage your registered items and activity',
      agent: 'Track lost & found items and users',
      admin: 'System overview and management'
    },
    registerNewItem: 'Register New Item',
    tabs: {
      overview: 'Overview',
      items: 'Items',
      reports: 'Reports',
      payments: 'Payments'
    },
    registeredItems: 'Registered Items',
    lostReports: 'Lost Reports',
    foundReports: 'Found Reports',
    totalSpent: 'Total Spent',
    recentlyRegisteredItems: 'Recently Registered Items',
    recentItemsDescription: 'Your most recently registered items'
  },
  
  // Item Registration
  item_registration: 'Item Registration',
  item_registration_form: 'Item Registration Form',
  item_name: 'Item Name',
  item_category: 'Category',
  item_category_electronics: 'Electronics',
  item_category_clothing: 'Clothing',
  item_category_jewelry: 'Jewelry',
  item_category_documents: 'Documents',
  item_category_accessories: 'Accessories',
  item_category_other: 'Other',
  item_subcategory: 'Subcategory',
  item_subcategory_phone: 'Phone',
  item_subcategory_laptop: 'Laptop',
  item_subcategory_tablet: 'Tablet',
  item_subcategory_camera: 'Camera',
  item_subcategory_watch: 'Watch',
  item_subcategory_headphones: 'Headphones',
  item_subcategory_shirt: 'Shirt',
  item_subcategory_pants: 'Pants',
  item_subcategory_dress: 'Dress',
  item_subcategory_coat: 'Coat',
  item_subcategory_shoes: 'Shoes',
  item_subcategory_ring: 'Ring',
  item_subcategory_necklace: 'Necklace',
  item_subcategory_bracelet: 'Bracelet',
  item_subcategory_earrings: 'Earrings',
  item_subcategory_passport: 'Passport',
  item_subcategory_id_card: 'ID Card',
  item_subcategory_driver_license: 'Driver\'s License',
  item_subcategory_certificate: 'Certificate',
  item_subcategory_bag: 'Bag',
  item_subcategory_wallet: 'Wallet',
  item_subcategory_sunglasses: 'Sunglasses',
  item_subcategory_umbrella: 'Umbrella',
  item_subcategory_keys: 'Keys',
  item_uuid: 'Unique Identifier',
  item_serial: 'Serial Number',
  item_imei: 'IMEI Number',
  item_description: 'Description',
  item_status: 'Status',
  item_status_registered: 'Registered',
  item_status_lost: 'Lost',
  item_status_found: 'Found',
  item_status_recovered: 'Recovered',
  item_location: 'Last Known Location',
  item_image: 'Item Image',
  item_images: 'Item Images',
  item_date: 'Date',
  item_time: 'Time',
  item_add_images: 'Add Images',
  item_add_documents: 'Add Documents',
  item_drag_images: 'Drag & drop images or click to browse',
  item_drag_documents: 'Drag & drop documents or click to browse',
  item_preview: 'Preview',
  item_review: 'Review',
  item_register_success: 'Item registered successfully',
  item_register_error: 'Failed to register item',
  item_register_payment: 'Registration Payment',
  item_register_fee: 'Registration Fee',
  item_registration_summary: 'Registration Summary',
  item_progress: 'Progress',
  item_fee_description: 'Initial registration & global database entry fee.',
  item_ssl_secured: 'SSL Secured Transaction',
  item_verified_certificate: 'Verified Ownership Certificate',
  item_qr_preview: 'QR Preview',
  item_detected_id: 'ID Detected',
  item_detected_id_desc: 'Detected unique identifier: {{id}}',
  item_draft_saved: 'Draft Saved',
  
  // Smart ID Recognition
  smart_id_title: 'Smart ID Recognition',
  smart_id_description: 'Upload an image containing serial numbers, IMEI, or other identifiers to automatically detect them.',
  smart_id_upload: 'Upload Image',
  smart_id_results: 'Recognition Results',
  smart_id_processing: 'Processing image...',
  smart_id_no_results: 'No identifiers detected. Try another image or enter manually.',
  smart_id_select_identifier: 'Select the correct identifier:',
  smart_id_use_selected: 'Use Selected Identifier',
  
  // QR Code
  qr_title: 'QR Code Generator',
  qr_description: 'Generate custom QR codes for your item that can be printed and attached.',
  qr_recovery_tab: 'Recovery',
  qr_info_tab: 'Information',
  qr_recovery_title: 'Recovery QR Code',
  qr_recovery_description: 'Scan this code to report this item as found.',
  qr_recovery_code: 'Recovery QR Code',
  qr_info_title: 'Information QR Code',
  qr_info_description: 'Scan this code to view item details.',
  qr_info_code: 'Information QR Code',
  qr_customize: 'Customize',
  qr_error_correction: 'Error Correction Level',
  qr_error_low: 'Low (L)',
  qr_error_medium: 'Medium (M)',
  qr_error_quartile: 'Quartile (Q)',
  qr_error_high: 'High (H)',
  qr_size: 'Size',
  qr_margin: 'Margin',
  qr_colors: 'Colors',
  qr_foreground: 'Foreground',
  qr_background: 'Background',
  qr_download: 'Download',
  qr_print: 'Print',
  qr_share: 'Share',
  qr_scan_text: 'Scan this QR code with your smartphone camera',
  
  // Ownership Chain
  ownership_title: 'Ownership Verification Chain',
  ownership_description: 'Upload documents that verify the ownership history of this item.',
  ownership_empty: 'No ownership documents added yet.',
  ownership_add: 'Add Document',
  ownership_document_type: 'Document Type',
  ownership_receipt: 'Receipt',
  ownership_invoice: 'Invoice',
  ownership_warranty: 'Warranty',
  ownership_certificate: 'Certificate',
  ownership_transfer: 'Transfer Document',
  ownership_other: 'Other',
  ownership_date_issued: 'Date Issued',
  ownership_issuer: 'Issuer / Authority',
  ownership_notes: 'Notes',
  ownership_pending: 'Pending Verification',
  ownership_verified: 'Verified',
  ownership_rejected: 'Rejected',
  
  // Batch Upload
  batch_upload_title: 'Batch Image Upload',
  batch_upload_description: 'Upload and arrange multiple images of your item.',
  batch_upload_drag: 'Drag & drop images or click to browse',
  batch_upload_max_files: 'Maximum {{count}} files',
  batch_upload_too_many: 'Too many files. Maximum allowed is {{max}}.',
  batch_upload_too_large: 'File too large. Maximum size is {{max}}MB.',
  batch_upload_invalid_type: 'Invalid file type. Only images are allowed.',
  batch_upload_add_more: 'Add More',
  batch_upload_remove_all: 'Remove All',
  batch_upload_reorder: 'Drag to reorder images',

  // Reports
  report_lost_title: 'Report Lost Item',
  report_lost_description: 'Fill out this form to report a lost item.',
  report_found_title: 'Report Found Item',
  report_found_description: 'Fill out this form to report a found item.',
  report_item_details: 'Item Details',
  report_location: 'Location',
  report_date: 'Date',
  report_time: 'Time',
  report_description: 'Description',
  report_contact: 'Contact Information',
  report_submit_success: 'Report submitted successfully',
  report_submit_error: 'Failed to submit report',
  
  // Profile
  profile_title: 'Profile',
  profile_personal_info: 'Personal Information',
  profile_username: 'Username',
  profile_name: 'Name',
  profile_email: 'Email',
  profile_phone: 'Phone',
  profile_address: 'Address',
  profile_update: 'Update Profile',
  profile_update_success: 'Profile updated successfully',
  profile_update_error: 'Failed to update profile',
  
  // Profile nested
  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information'
  },
  
  // Settings
  settings_title: 'Settings',
  settings_account: 'Account',
  settings_notifications: 'Notifications',
  settings_language: 'Language',
  settings_appearance: 'Appearance',
  settings_privacy: 'Privacy',
  settings_security: 'Security',
  settings_dark_mode: 'Dark Mode',
  settings_light_mode: 'Light Mode',
  
  // Settings nested
  settings: {
    title: 'Settings',
    account: 'Account',
    notifications: 'Notifications',
    language: 'Language',
    appearance: 'Appearance',
    privacy: 'Privacy',
    security: 'Security'
  },
  
  // Notifications
  notification_new_item: 'New item registered',
  notification_item_lost: 'Item marked as lost',
  notification_item_found: 'Item marked as found',
  notification_item_recovered: 'Item marked as recovered',
  notification_new_report: 'New report submitted',
  notification_match_found: 'Potential match found',
  
  // Payments
  payment_title: 'Payment',
  payment_method: 'Payment Method',
  payment_card: 'Credit/Debit Card',
  payment_mobile: 'Mobile Money',
  payment_bank: 'Bank Transfer',
  payment_amount: 'Amount',
  payment_fee: 'Fee',
  payment_total: 'Total',
  payment_status: 'Status',
  payment_date: 'Date',
  payment_success: 'Payment successful',
  payment_error: 'Payment failed',
  payment_processing: 'Processing payment...',
  payment_receipt: 'Payment Receipt',
  
  // Identity Verification
  verification_title: 'Identity Verification',
  verification_subtitle: 'Verify your identity to increase trust and unlock premium features.',
  verification_status_verified: 'Verified Account',
  verification_in_progress_title: 'Verification in Progress',
  verification_in_progress_desc: 'Your request is currently being reviewed by our team. You\'ll be notified via email once completed.',
  verification_complete_title: 'Verification Complete',
  verification_complete_desc: 'Congratulations! Your identity has been verified.',
  verification_submit_new: 'Submit New Documents',
  verification_submit_title: 'Submit New Request',
  verification_submit_desc: 'Select a document type and upload clear photos.',
  verification_upload_label: 'Upload Documents (Max 3)',
  verification_why_title: 'Why verify?',
  verification_trust_title: 'Trust',
  verification_trust_desc: 'Verified users have higher credibility when transferring ownership.',
  verification_premium_title: 'Premium Features',
  verification_premium_desc: 'Unlock higher registration limits and premium item labels.',
  verification_security_title: 'Security',
  verification_security_desc: 'Protect your account against unauthorized ownership claims.',
  verification_history_title: 'Recent History',
  verification_no_history: 'No previous requests found.',
  
  // Form Validations
  validation_required: 'This field is required',
  validation_min_length: 'Must be at least {{min}} characters',
  validation_max_length: 'Must be less than {{max}} characters',
  validation_invalid_email: 'Invalid email address',
  validation_password_match: 'Passwords do not match',
  validation_invalid_format: 'Invalid format',
  
  // Errors
  error_not_found: 'Not found',
  error_unauthorized: 'Unauthorized',
  error_forbidden: 'Forbidden',
  error_server: 'Server error',
  error_network: 'Network error',
  error_unknown: 'Unknown error',
  error_try_again: 'Please try again',
  
  // Success
  success_item_created: 'Item created successfully',
  success_item_updated: 'Item updated successfully',
  success_item_deleted: 'Item deleted successfully',
  success_report_created: 'Report created successfully',
  success_report_updated: 'Report updated successfully',
  success_report_deleted: 'Report deleted successfully',
  
  // Landing Page - flat (for backward compatibility)
  'landing.nav.features': 'Features',
  'landing.nav.howItWorks': 'How It Works',
  'landing.nav.testimonials': 'Testimonials',
  'landing.trustedUsers': 'Trusted by thousands of users',
  'landing.heroTitle1': 'Secure Digital Protection',
  'landing.heroTitle2': 'For Your Valuable Items',
  'landing.heroSubtitle': 'Register, protect and easily recover your items with our comprehensive digital platform.',
  'landing.registerNow': 'Register Now',
  'landing.learnMore': 'Learn More',
  'landing.secure': 'Secure & Private',
  'landing.digitalCertificates': 'Digital Certificates',
  'landing.itemRegistration': 'Item Registration',
  'landing.registered': 'Registered',
  'landing.demoItem.name': 'Samsung Galaxy S22',
  'landing.demoItem.serial': 'SN: GHXK29803MVXA',
  'landing.demoItem.date': 'Registered: April 25, 2025',
  'landing.demoItem.certificate': 'Digital Certificate',
  'landing.powerfulFeatures': 'Powerful Features',
  'landing.completeSolution': 'Complete Solution for',
  'landing.itemManagement': 'Item Management',
  'landing.kizereProvides': 'KIZERE provides a comprehensive platform for registering, protecting, and recovering your valuable items.',
  'landing.howItWorks.simpleProcess': 'Simple Process',
  'landing.howItWorks.sectionTitle': 'How It Works',
  'landing.howItWorks.description': 'Our platform makes it easy to register your items and secure them with digital certificates. Follow these simple steps:',
  'landing.howItWorks.communityDesc': 'Join thousands of users protecting their valuables with KIZERE',
  'landing.howItWorks.step1Title': 'Register Your Item',
  'landing.howItWorks.step1Desc': 'Upload details and photos of your item with our easy-to-use registration form.',
  'landing.howItWorks.step2Title': 'Generate Digital Certificate',
  'landing.howItWorks.step2Desc': 'Receive a secure digital certificate that proves your ownership.',
  'landing.howItWorks.step3Title': 'Print QR Code Tags',
  'landing.howItWorks.step3Desc': 'Attach QR code tags to your items for easy identification and recovery.',
  'landing.howItWorks.step4Title': 'Quick Recovery Process',
  'landing.howItWorks.step4Desc': 'If your item is lost, the finder can scan the QR code to initiate the recovery process.',
  'landing.testimonials.sectionTitle': 'User Testimonials',
  'landing.testimonials.mainTitle': 'What Our Users Say',
  'landing.testimonials.subtitle': 'Hear from people who have successfully protected and recovered their valuable items.',
  'landing.testimonials.testimonial1.name': 'James M.',
  'landing.testimonials.testimonial1.location': 'Kigali, Rwanda',
  'landing.testimonials.testimonial1.quote': 'I lost my laptop at the airport, but thanks to KIZERE, it was returned to me within 24 hours. The QR code system works amazingly well!',
  'landing.testimonials.testimonial2.name': 'Francine N.',
  'landing.testimonials.testimonial2.location': 'Musanze, Rwanda',
  'landing.testimonials.testimonial2.quote': 'The registration process was so simple, and I love the peace of mind knowing all my valuables are protected with digital certificates.',
  'landing.testimonials.testimonial3.name': 'Robert K.',
  'landing.testimonials.testimonial3.location': 'Huye, Rwanda',
  'landing.testimonials.testimonial3.quote': 'When my phone was lost, the finder scanned the QR code, and I was notified immediately. This service is truly a game-changer!',
  'landing.testimonials.viewMore': 'View More Testimonials',
  
  // Landing Page - nested structure
  landing: {
    nav: {
      features: 'Features',
      howItWorks: 'How It Works',
      testimonials: 'Testimonials'
    },
    trustedUsers: 'Trusted by thousands of users',
    heroTitle1: 'Secure Digital Protection',
    heroTitle2: 'For Your Valuable Items',
    heroSubtitle: 'Register, protect and easily recover your items with our comprehensive digital platform.',
    registerNow: 'Register Now',
    learnMore: 'Learn More',
    secure: 'Secure & Private',
    digitalCertificates: 'Digital Certificates',
    itemRegistration: 'Item Registration',
    registered: 'Registered',
    demoItem: {
      name: 'Samsung Galaxy S22',
      serial: 'SN: GHXK29803MVXA',
      date: 'Registered: April 25, 2025',
      certificate: 'Digital Certificate'
    },
    powerfulFeatures: 'Powerful Features',
    completeSolution: 'Complete Solution for',
    itemManagement: 'Item Management',
    kizereProvides: 'KIZERE provides a comprehensive platform for registering, protecting, and recovering your valuable items.',
    
    // Features section
    feature1Title: 'Smart ID Recognition',
    feature1Desc: 'Our advanced OCR technology automatically detects serial numbers, IMEI, and other identifiers from images.',
    feature2Title: 'Ownership Verification Chain',
    feature2Desc: 'Upload and manage documents that verify the ownership history of your items for greater security.',
    feature3Title: 'QR Code Generation',
    feature3Desc: 'Generate custom QR codes for your items that can be printed and attached for easy recovery.',
    feature4Title: 'Batch Image Upload',
    feature4Desc: 'Upload and arrange multiple images of your items with an intuitive drag-and-drop interface.',
    feature5Title: 'Item Analytics',
    feature5Desc: 'Get detailed statistics about your registered items and recovery success rates.',
    feature6Title: 'Global Recovery Network',
    feature6Desc: 'Access to our worldwide network of agents to help recover your lost items quickly.',
    learnMoreAction: 'Learn More',
    
    // Stats and call to action
    startToday: 'Start Today',
    readyToSecure: 'Ready to Secure Your Valuables?',
    joinThousands: 'Join thousands of satisfied users protecting their items with KIZERE',
    createFreeAccount: 'Create Free Account',
    noCardRequired: 'No credit card required',
    statItems: 'Items Registered',
    statRecoveries: 'Items Recovered',
    statUsers: 'Active Users',
    statSatisfaction: 'Satisfaction Rate',
    
    howItWorks: {
      simpleProcess: 'Simple Process',
      sectionTitle: 'How It Works',
      description: 'Our platform makes it easy to register your items and secure them with digital certificates. Follow these simple steps:',
      communityDesc: 'Join thousands of users protecting their valuables with KIZERE',
      step1Title: 'Register Your Item',
      step1Desc: 'Upload details and photos of your item with our easy-to-use registration form.',
      step2Title: 'Generate Digital Certificate',
      step2Desc: 'Receive a secure digital certificate that proves your ownership.',
      step3Title: 'Print QR Code Tags',
      step3Desc: 'Attach QR code tags to your items for easy identification and recovery.',
      step4Title: 'Quick Recovery Process',
      step4Desc: 'If your item is lost, the finder can scan the QR code to initiate the recovery process.'
    },
    
    testimonials: {
      sectionTitle: 'User Testimonials',
      mainTitle: 'What Our Users Say',
      subtitle: 'Hear from people who have successfully protected and recovered their valuable items.',
      testimonial1: {
        name: 'James M.',
        location: 'Kigali, Rwanda',
        quote: 'I lost my laptop at the airport, but thanks to KIZERE, it was returned to me within 24 hours. The QR code system works amazingly well!'
      },
      testimonial2: {
        name: 'Francine N.',
        location: 'Musanze, Rwanda',
        quote: 'The registration process was so simple, and I love the peace of mind knowing all my valuables are protected with digital certificates.'
      },
      testimonial3: {
        name: 'Robert K.',
        location: 'Huye, Rwanda',
        quote: 'When my phone was lost, the finder scanned the QR code, and I was notified immediately. This service is truly a game-changer!'
      },
      viewMore: 'View More Testimonials'
    },
    
    // Mobile app section
    mobileApp: {
      sectionTitle: 'Mobile Access',
      mainTitle: 'KIZERE on Your Mobile Device',
      description: 'Access your items, manage certificates, and respond to lost & found alerts from anywhere with our mobile app.',
      features: {
        feature1: 'Instant notifications when your lost item is found',
        feature2: 'Scan QR codes directly from the app',
        feature3: 'Offline access to your digital certificates',
        feature4: 'Secure biometric authentication'
      },
      downloadOn: 'Download on',
      appStore: 'App Store',
      getItOn: 'Get it on',
      googlePlay: 'Google Play'
    },
    
    // FAQ section
    faq: {
      sectionTitle: 'Questions & Answers',
      mainTitle: 'Frequently Asked Questions',
      description: 'Find answers to commonly asked questions about our service.',
      questions: {
        security: {
          question: 'How secure is my data on KIZERE?',
          answer: 'We use industry-standard encryption protocols to protect your data. All personal information and item details are encrypted both in transit and at rest, and we regularly perform security audits to ensure your data remains safe.'
        },
        items: {
          question: 'What types of items can I register?',
          answer: 'You can register almost any valuable item including electronics, jewelry, documents, accessories, and more. Our system is particularly effective for items with unique identifiers like serial numbers, IMEI numbers, or other distinguishing characteristics.'
        },
        lostFound: {
          question: 'How does the lost and found process work?',
          answer: 'When someone finds your item, they can scan the QR code attached to it. This notifies you immediately and provides the finder with instructions on how to safely return your item to you, while protecting your privacy.'
        },
        limits: {
          question: 'Is there a limit to how many items I can register?',
          answer: 'Basic accounts can register up to 5 items. Premium subscribers can register unlimited items and access additional features like priority support and enhanced recovery services.'
        }
      },
      contactUs: 'Can\'t find your answer? Contact our support team.'
    },
    
    // Footer
    footerDescription: 'KIZERE is a comprehensive platform for item registration, lost and found reporting, and ownership management with a focus on security and efficiency.',
    footer: {
      quickLinks: 'Quick Links',
      home: 'Home',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      resources: 'Resources',
      blog: 'Blog',
      documentation: 'Documentation',
      community: 'Community',
      tutorials: 'Tutorials',
      contact: 'Contact Us',
      location: 'Kigali, Rwanda',
      copyright: '© 2025 KIZERE. All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      cookiePolicy: 'Cookie Policy'
    }
  },
  
  // Common
  common: {
    notifications: 'Notifications',
    new: 'New',
    ago: 'hours ago',
    viewAll: 'View All',
    register_item: 'Register Your Item',
    complete_registration: 'Complete Registration',
    processing: 'Processing...',
    save_draft: 'Save Draft',
  },
  
  // Auth
  auth: {
    signIn: 'Sign In',
    register: 'Register',
    signOut: 'Sign Out',
    login: 'Login',
    getStarted: 'Get Started',
    logout: 'Logout',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password'
  },
  
  // Notifications
  notifications: {
    itemMatched: 'Item Match Found',
    itemMatchedDesc: 'Someone reported finding an item that matches your lost item description.',
    title: 'Notifications',
    subtitle: 'Stay updated on your items and claims',
    empty: 'No notifications',
    emptyUnread: 'No unread notifications',
    emptyDesc: 'We\'ll notify you here when there are updates.',
    markAsRead: 'Mark as read',
    markAllRead: 'Mark all as read',
    markAllReadSuccess: 'All notifications marked as read',
    markAllReadError: 'Failed to mark notifications as read',
    viewMatch: 'View Match',
    clearAll: 'Clear All',
    clearAllSuccess: 'All notifications cleared',
    clearAllError: 'Failed to clear notifications',
    deleteSuccess: 'Notification deleted',
    deleteError: 'Failed to delete notification',
    tabs: {
      all: 'All',
      unread: 'Unread',
      alerts: 'Alerts',
      system: 'System'
    }
  },
  
  // Misc
  contact_us: 'Contact Us',
  about_us: 'About Us',
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  faq: 'FAQ',
  help_center: 'Help Center',
  copyright: '© {{year}} KIZERE. All rights reserved.',
};