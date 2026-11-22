/* ==========================================================================
   Store settings
   Edit this file to rename the store and set your own contact details,
   shipping rules, EMI options and the copy that appears on the home page.
   Every value here is a placeholder.
   ========================================================================== */
window.PCS = window.PCS || {};

PCS.config = {
  name: 'YourBrand',
  tagline: 'Gaming, editing, trading and office PCs, built and delivered.',

  phone: '+91 90000 00000',
  phoneTel: '+919000000000',        // digits only, used for the tel: link
  whatsapp: '919000000000',         // country code + number, digits only
  email: 'hello@yourbrand.example',
  address: ['12 Example Road, Sample Nagar', 'Your City, Your State 000000'],
  mapsUrl: 'https://maps.google.com/',
  hours: 'Every day, 10 AM to 6 PM',

  social: [
    { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/' },
    { name: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/' },
    { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/' },
    { name: 'X', icon: 'xsocial', url: 'https://x.com/' }
  ],

  currency: { locale: 'en-IN', code: 'INR' },
  gstPercent: 18,                                  // prices are treated as GST-inclusive
  shipping: { freeAbove: 5000, flat: 199 },        // flat fee applies below the free-shipping amount
  emi: { tenures: [3, 6, 9, 12], annualInterestPct: 0 },   // 0 means no-cost EMI (price / months)

  /* Thin strip above the header */
  ticker: [
    'EMI on every PC',
    'Delivery across India',
    'GST invoice on every order',
    'Stress-tested before dispatch'
  ],

  /* "Why buy here" block on the home page. Only keep claims that are true for your store. */
  commitments: [
    { icon: 'bolt', title: 'Stress-tested', text: 'Every PC runs a full load test before it is packed.' },
    { icon: 'box', title: 'Damage-proof packing', text: 'Foam and a double box for the courier trip.' },
    { icon: 'card', title: 'EMI options', text: 'Split the cost over 3 to 12 months.' },
    { icon: 'shield', title: 'Genuine parts', text: 'Brand warranty on every part, with help on claims.' },
    { icon: 'receipt', title: 'GST invoice', text: 'Invoices for business and bulk orders.' },
    { icon: 'chat', title: 'Real people', text: 'Ask on WhatsApp before you buy and after.' }
  ],

  /* The sample test sheet shown next to the commitments */
  testSheet: [
    ['CPU load test, 30 minutes', 'Passed'],
    ['GPU load test, 30 minutes', 'Passed'],
    ['Memory test', 'Passed'],
    ['SSD health check', 'Passed'],
    ['Fans and lighting', 'Passed'],
    ['Cable routing', 'Checked']
  ],

  /* "From cart to your desk" steps */
  steps: [
    { icon: 'cart', title: 'Order', text: 'Order online, or confirm on WhatsApp.' },
    { icon: 'wrench', title: 'Assembly', text: 'Parts go in with tidy cable routing.' },
    { icon: 'bolt', title: 'Stress test', text: 'Heat, stability and speed are checked.' },
    { icon: 'box', title: 'Packing', text: 'Foam, straps and a second box.' },
    { icon: 'truck', title: 'Delivery', text: 'A tracked courier brings it to you.' }
  ],

  faq: [
    { q: 'Do you deliver across India?', a: 'Yes. We ship with tracked couriers and damage-proof packing. Delivery time depends on your pincode and is shown at checkout.' },
    { q: 'Can I pay in EMI?', a: 'Yes. Credit card EMI and no-card EMI options are available on most PCs. Tenure and approval depend on your bank or EMI partner.' },
    { q: 'Can I change the parts in a prebuilt PC?', a: 'Yes. Message us on WhatsApp with what you want to change, or use the custom build page to pick every part yourself.' },
    { q: 'How does the warranty work?', a: 'Parts carry the brand warranty. If something fails, contact us with your invoice and we will guide you through the claim.' },
    { q: 'What is your return policy?', a: 'Replace this answer with your own return and refund rules, and link to the full policy page.' },
    { q: 'Can I visit the store?', a: 'Yes. See the address and opening hours at the bottom of this page.' },
    { q: 'Do you give a GST invoice?', a: 'Yes. Add your GST number at checkout. For office or bulk orders, message us on WhatsApp for a quote.' }
  ],

  /* Store assistant: the chat button in the corner of every page.
     The built-in assistant answers from this file and js/data.js. It runs in the browser
     and sends nothing anywhere. For open-ended questions you can also connect a hosted
     AI model through your own server: put its address in `endpoint` (see server/README.md). */
  assistant: {
    enabled: true,                  // false removes the chat button
    name: 'Store assistant',
    greeting: 'Hi, I am the store assistant. Tell me what the PC is for and your budget and I will suggest options. I can also help with parts, EMI, delivery and warranty.',
    endpoint: ''                    // optional, for example 'https://your-server.example/chat'
  }
};
