export const SAMPLE_REQUIREMENTS_JSON = JSON.stringify(
  {
    tender: {
      tender_id: 'T-2026-0417',
      title: 'Supply of IT Equipment',
      procuring_entity: 'Directorate of Information Technology',
      bidder: 'Tech Solutions Bangladesh Ltd.',
      submission_deadline: '2026-10-20'
    },
    requirements: [
      {
        id: 'R01',
        order: 1,
        title_en: 'Trade License',
        title_bn: 'হালনাগাদ ট্রেড লাইসেন্স',
        mandatory: true,
        has_expiry: true
      },
      {
        id: 'R02',
        order: 2,
        title_en: 'Tax Clearance Certificate',
        title_bn: 'আয়কর পরিশোধ প্রত্যয়নপত্র',
        mandatory: true,
        has_expiry: true
      },
      {
        id: 'R03',
        order: 3,
        title_en: 'Bank Solvency Certificate',
        title_bn: 'ব্যাংক সচ্ছলতা সনদ',
        mandatory: true,
        has_expiry: false
      },
      {
        id: 'R04',
        order: 4,
        title_en: 'Manufacturer Authorization Letter',
        title_bn: 'প্রস্তুতকারকের অনুমোদনপত্র',
        mandatory: false,
        has_expiry: true
      },
      {
        id: 'R05',
        order: 5,
        title_en: 'Similar Experience Credentials',
        title_bn: 'অনুরূপ কাজের অভিজ্ঞতার সনদ',
        mandatory: false,
        has_expiry: false
      }
    ]
  },
  null,
  2
);
