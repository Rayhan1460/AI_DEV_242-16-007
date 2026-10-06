export type Language = 'en' | 'bn';

export interface Translations {
  // Header
  appTitle: string;
  appSubtitle: string;
  stageBadge: string;
  langSwitchBtn: string;

  // Requirements Loader
  reqSectionTitle: string;
  reqStepTag: string;
  reqDropzoneText: string;
  reqDropzoneHint: string;
  reqLoadSampleBtn: string;
  reqLoadedFile: string;
  reqValidationError: string;

  // Tender Details
  tenderDetailsTitle: string;
  tenderIdLabel: string;
  projectTitleLabel: string;
  procuringEntityLabel: string;
  bidderLabel: string;
  submissionDeadlineLabel: string;
  totalReqsLabel: string;
  mandatoryLabel: string;
  optionalLabel: string;

  // PDF Uploader
  pdfSectionTitle: string;
  pdfStepTag: string;
  filesUploadedLabel: string;
  totalStorageLabel: string;
  pdfDropzoneText: string;
  pdfDropzoneHint: string;
  generatingSamplePdfsBtn: string;
  analyzingPdfsText: string;
  uploadErrorLabel: string;

  // Uploaded File List
  uploadedFilesTitle: string;
  colFileName: string;
  colPages: string;
  colSize: string;
  colHash: string;
  colDuplicate: string;
  colMatchedTo: string;
  colAction: string;
  pageUnit: string;
  pagesUnit: string;
  duplicateBadge: string;
  uniqueBadge: string;
  unassignedText: string;
  matchedBadge: string;
  removeBtn: string;
  noPdfsUploaded: string;

  // Requirements Table
  matchingSectionTitle: string;
  matchingStepTag: string;
  colOrder: string;
  colRequirement: string;
  colType: string;
  colMatchedPdf: string;
  colExpiryDate: string;
  colCurrentStatus: string;
  selectPdfPrompt: string;
  undoMatchTooltip: string;
  matchFileToSetExpiry: string;
  noExpiryNeeded: string;
  expiresBadge: string;

  // Status Labels
  statusMissing: string;
  statusExpiryNeeded: string;
  statusExpired: string;
  statusNotProvided: string;
  statusOk: string;

  // Blocking & Package Generation
  packageSectionTitle: string;
  packageSubtitle: string;
  readyBadge: string;
  blockingBadge: string;
  blockingBoxTitle: string;
  successBannerText: string;
  btnGeneratePackage: string;
  btnGenerating: string;
  btnDownloadPackage: string;
  packageReadyNotice: string;
  btnHelperText: string;
  generationSuccessTitle: string;
  generationSuccessSubtitle: string;
  downloadReadyText: string;

  // Reasons
  reasonMissing: string;
  reasonExpiryNeeded: string;
  reasonExpired: string;
  reasonOptionalNotProvided: string;
  reasonOk: string;

  // Footer
  footerTitle: string;
  footerSubtitle: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Tender Document Package Builder',
    appSubtitle: 'Frontend-only client-side document matching, expiry verification, and PDF package generation',
    stageBadge: 'STAGE 2 — MANDATORY FEATURES COMPLETE',
    langSwitchBtn: 'বাংলা',

    reqSectionTitle: '1. Requirements Configuration',
    reqStepTag: 'JSON Input',
    reqDropzoneText: 'Choose requirements.json or drag & drop here',
    reqDropzoneHint: 'Validates tender metadata, dates, and requirements hierarchy dynamically',
    reqLoadSampleBtn: 'Load Competition Sample Dataset',
    reqLoadedFile: 'Loaded',
    reqValidationError: 'Validation Error',

    tenderDetailsTitle: 'Tender Details',
    tenderIdLabel: 'Tender ID',
    projectTitleLabel: 'Project Title:',
    procuringEntityLabel: 'Procuring Entity:',
    bidderLabel: 'Bidder / Submitter:',
    submissionDeadlineLabel: 'Submission Deadline:',
    totalReqsLabel: 'Total Requirements:',
    mandatoryLabel: 'Mandatory:',
    optionalLabel: 'Optional:',

    pdfSectionTitle: '2. PDF Upload Foundation',
    pdfStepTag: 'Multi-File PDF',
    filesUploadedLabel: 'Files Uploaded:',
    totalStorageLabel: 'Total Storage:',
    pdfDropzoneText: 'Choose PDF Files or drag & drop here (Multiple allowed)',
    pdfDropzoneHint: 'Validates PDF magic bytes, calculates SHA-256 hash, and detects exact duplicates',
    generatingSamplePdfsBtn: 'Generate Sample Test PDFs (Includes 1 Content Duplicate)',
    analyzingPdfsText: 'Analyzing and validating PDFs...',
    uploadErrorLabel: 'Upload Error',

    uploadedFilesTitle: 'Uploaded PDF Documents',
    colFileName: 'File Name',
    colPages: 'Pages',
    colSize: 'Size',
    colHash: 'SHA-256 Hash',
    colDuplicate: 'Status / Duplicate',
    colMatchedTo: 'Matched To',
    colAction: 'Action',
    pageUnit: 'page',
    pagesUnit: 'pages',
    duplicateBadge: '⚠️ Duplicate Content',
    uniqueBadge: 'Unique',
    unassignedText: 'Unassigned',
    matchedBadge: 'Matched:',
    removeBtn: 'Remove',
    noPdfsUploaded: 'No PDF documents uploaded yet. Upload your PDF files above to begin matching.',

    matchingSectionTitle: '3. Document Matching & Verification',
    matchingStepTag: 'Matching Engine',
    colOrder: '#',
    colRequirement: 'Requirement Document',
    colType: 'Type',
    colMatchedPdf: 'Matched PDF',
    colExpiryDate: 'Expiry Date',
    colCurrentStatus: 'Current Status',
    selectPdfPrompt: '-- Select uploaded PDF --',
    undoMatchTooltip: 'Undo match',
    matchFileToSetExpiry: 'Match file to set expiry',
    noExpiryNeeded: 'N/A (No expiry)',
    expiresBadge: 'Expires',

    statusMissing: 'Missing',
    statusExpiryNeeded: 'Expiry date needed',
    statusExpired: 'Expired',
    statusNotProvided: 'Not provided',
    statusOk: 'OK',

    packageSectionTitle: '4. Package Readiness & Submission Check',
    packageSubtitle: 'All mandatory documents must be matched with valid unexpired dates before package generation.',
    readyBadge: 'READY FOR PACKAGE GENERATION',
    blockingBadge: 'BLOCKING ISSUES',
    blockingBoxTitle: '⚠️ The following issues prevent package generation:',
    successBannerText: 'Validation Succeeded: All required tender documents are correctly matched and verified. No blocking issues detected.',
    btnGeneratePackage: 'Generate Package',
    btnGenerating: 'Generating Package PDF...',
    btnDownloadPackage: 'Download Tender Package PDF',
    packageReadyNotice: 'Tender document package has been compiled and is ready for download.',
    btnHelperText: 'Package generation is locked until all "Missing", "Expiry date needed", and "Expired" issues are resolved.',
    generationSuccessTitle: '✓ Package Generated Successfully',
    generationSuccessSubtitle: 'Single unified tender package created with English cover page, included documents in requirement order, and page footers.',
    downloadReadyText: 'Your PDF package is ready for download.',

    reasonMissing: 'Mandatory requirement requires a matched PDF document.',
    reasonExpiryNeeded: 'Expiry date is required for this document.',
    reasonExpired: 'Document expires before the tender submission deadline.',
    reasonOptionalNotProvided: 'Optional document not provided.',
    reasonOk: 'Document matched and verified.',

    footerTitle: 'Tender Document Package Builder • Stage 2 Complete Mandatory Features',
    footerSubtitle: 'All processing takes place in browser memory • No external services used'
  },
  bn: {
    appTitle: 'দরপত্র নথি প্যাকেজ প্রস্তুতকারক',
    appSubtitle: 'ব্রাউজার-ভিত্তিক নথি মেলানো, মেয়াদ যাচাই এবং একক পিডিএফ প্যাকেজ প্রস্তুতকারী ইঞ্জিন',
    stageBadge: 'পর্যায় ২ — বাধ্যতামূলক ফিচারসমূহ সম্পূর্ণ',
    langSwitchBtn: 'English',

    reqSectionTitle: '১. প্রয়োজনীয় নথির তালিকা কনফিগারেশন',
    reqStepTag: 'JSON ইনপুট',
    reqDropzoneText: 'requirements.json নির্বাচন করুন অথবা এখানে টেনে আনুন',
    reqDropzoneHint: 'দরপত্রের বিবরণ, জমা দেওয়ার শেষ তারিখ ও নথির তালিকা স্বয়ংক্রিয়ভাবে যাচাই করে',
    reqLoadSampleBtn: 'নমুনা ডেটাসেট লোড করুন',
    reqLoadedFile: 'লোড হয়েছে',
    reqValidationError: 'যাচাইকরণ ত্রুটি',

    tenderDetailsTitle: 'দরপত্রের বিবরণ',
    tenderIdLabel: 'দরপত্র নম্বর',
    projectTitleLabel: 'প্রকল্পের নাম:',
    procuringEntityLabel: 'সংগ্রহকারী কর্তৃপক্ষ:',
    bidderLabel: 'দরদাতা প্রতিষ্ঠান:',
    submissionDeadlineLabel: 'জমা দেওয়ার শেষ সময়:',
    totalReqsLabel: 'মোট প্রয়োজনীয় নথি:',
    mandatoryLabel: 'বাধ্যতামূলক:',
    optionalLabel: 'ঐচ্ছিক:',

    pdfSectionTitle: '২. পিডিএফ আপলোড সেকশন',
    pdfStepTag: 'মাল্টি-ফাইল পিডিএফ',
    filesUploadedLabel: 'আপলোডকৃত ফাইল:',
    totalStorageLabel: 'মোট ফাইলের আকার:',
    pdfDropzoneText: 'পিডিএফ ফাইলসমূহ নির্বাচন করুন অথবা টেনে আনুন (একাধিক গ্রহণযোগ্য)',
    pdfDropzoneHint: 'পিডিএফ সিগনেচার, হ্যাশ ও ডুপ্লিকেট স্বয়ংক্রিয়ভাবে সনাক্ত করে',
    generatingSamplePdfsBtn: 'নমুনা টেস্ট পিডিএফ তৈরি করুন (১টি ডুপ্লিকেট সহ)',
    analyzingPdfsText: 'পিডিএফ যাচাই করা হচ্ছে...',
    uploadErrorLabel: 'আপলোড ত্রুটি',

    uploadedFilesTitle: 'আপলোডকৃত পিডিএফ নথিসমূহ',
    colFileName: 'ফাইলের নাম',
    colPages: 'পৃষ্ঠা',
    colSize: 'আকার',
    colHash: 'SHA-256 হ্যাশ',
    colDuplicate: 'স্ট্যাটাস / ডুপ্লিকেট',
    colMatchedTo: 'সংযুক্ত নথি',
    colAction: 'অ্যাকশন',
    pageUnit: 'পৃষ্ঠা',
    pagesUnit: 'পৃষ্ঠা',
    duplicateBadge: '⚠️ একই কন্টেন্ট (ডুপ্লিকেট)',
    uniqueBadge: 'অনন্য',
    unassignedText: 'অসংযুক্ত',
    matchedBadge: 'সংযুক্ত:',
    removeBtn: 'মুছুন',
    noPdfsUploaded: 'এখনো কোনো পিডিএফ আপলোড করা হয়নি। উপরে পিডিএফ ফাইল আপলোড করুন।',

    matchingSectionTitle: '৩. নথি সংযোজন ও মেয়াদ যাচাইকরণ',
    matchingStepTag: 'ম্যাচিং ইঞ্জিন',
    colOrder: '#',
    colRequirement: 'প্রয়োজনীয় নথি',
    colType: 'ধরণ',
    colMatchedPdf: 'সংযুক্ত পিডিএফ',
    colExpiryDate: 'মেয়াদোত্তীর্ণের তারিখ',
    colCurrentStatus: 'বর্তমান স্ট্যাটাস',
    selectPdfPrompt: '-- পিডিএফ নির্বাচন করুন --',
    undoMatchTooltip: 'সংযোগ বাতিল',
    matchFileToSetExpiry: 'মেয়াদ দিতে ফাইল সংযুক্ত করুন',
    noExpiryNeeded: 'প্রযোজ্য নয়',
    expiresBadge: 'মেয়াদ প্রযোজ্য',

    statusMissing: 'অনুপস্থিত',
    statusExpiryNeeded: 'মেয়াদোত্তীর্ণের তারিখ প্রয়োজন',
    statusExpired: 'মেয়াদোত্তীর্ণ',
    statusNotProvided: 'প্রদান করা হয়নি',
    statusOk: 'সঠিক',

    packageSectionTitle: '৪. প্যাকেজ প্রস্তুতি ও চূড়ান্ত যাচাইকরণ',
    packageSubtitle: 'প্যাকেজ তৈরির পূর্বে সকল বাধ্যতামূলক নথি সংযুক্ত এবং বৈধ মেয়াদ থাকতে হবে।',
    readyBadge: 'প্যাকেজ তৈরির জন্য প্রস্তুত',
    blockingBadge: 'টি সমস্যা সমাধান বাকি',
    blockingBoxTitle: '⚠️ নিচের সমস্যাগুলোর কারণে প্যাকেজ তৈরি করা যাচ্ছে না:',
    successBannerText: 'যাচাইকরণ সফল হয়েছে: সকল প্রয়োজনীয় নথি সঠিকভাবে সংযুক্ত ও পরীক্ষিত হয়েছে। কোনো সমস্যা নেই।',
    btnGeneratePackage: 'চূড়ান্ত প্যাকেজ তৈরি করুন',
    btnGenerating: 'পিডিএফ প্যাকেজ তৈরি হচ্ছে...',
    btnDownloadPackage: 'দরপত্র প্যাকেজ পিডিএফ ডাউনলোড করুন',
    packageReadyNotice: 'দরপত্র প্যাকেজ প্রস্তুত হয়েছে এবং ডাউনলোডের জন্য প্রস্তুত।',
    btnHelperText: '"অনুপস্থিত", "মেয়াদ প্রয়োজন" এবং "মেয়াদোত্তীর্ণ" সমস্যাসমূহ সমাধান না হওয়া পর্যন্ত প্যাকেজ তৈরি লক থাকবে।',
    generationSuccessTitle: '✓ প্যাকেজ সফলভাবে তৈরি হয়েছে',
    generationSuccessSubtitle: 'ইংরেজি কভার পেজ, ক্রমানুসারে সংযুক্ত নথিসমূহ এবং পেজ ফুটার সহ একক দরপত্র প্যাকেজ তৈরি হয়েছে।',
    downloadReadyText: 'আপনার পিডিএফ প্যাকেজ ডাউনলোডের জন্য প্রস্তুত।',

    reasonMissing: 'বাধ্যতামূলক নথির জন্য একটি পিডিএফ ফাইল সংযুক্ত করতে হবে।',
    reasonExpiryNeeded: 'এই নথির জন্য মেয়াদোত্তীর্ণের তারিখ প্রদান করতে হবে।',
    reasonExpired: 'নথিটির মেয়াদ দরপত্র জমা দেওয়ার তারিখের পূর্বে শেষ হয়েছে।',
    reasonOptionalNotProvided: 'ঐচ্ছিক নথি সংযুক্ত করা হয়নি।',
    reasonOk: 'নথি সংযুক্ত ও যাচাইকৃত হয়েছে।',

    footerTitle: 'দরপত্র নথি প্যাকেজ প্রস্তুতকারক • পর্যায় ২ সম্পূর্ণ',
    footerSubtitle: 'ব্রাউজার মেমরিতে সম্পূর্ণ প্রসেসিং সম্পন্ন হয় • কোনো সার্ভার ব্যবহৃত হয় না'
  }
};
