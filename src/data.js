export const EMAIL = 'official.aknovatech@gmail.com'

export const C = {
  paper: '#F3F6FF',
  ink: '#0B0E14',
  blue: '#1463FF',
  sun: '#FFC933',
  navy: '#0A1F5C',
  sky: '#9CCBFF',
}

// 3D models use a stronger version of the brand palette so they stay vivid under studio lighting.
export const TOY = { ...C, blue: '#0F5BFF', sun: '#FFB800', navy: '#1230A8', sky: '#1FA5FF', paper: '#FFFFFF' }

// Draft copy: check each line against what you actually offer.
export const SERVICE_INFO = [
  ['Web development', 'Fast websites and web apps that are easy for you to update.', ['Company websites', 'Online stores', 'Web apps']],
  ['UI/UX design', 'Screens people understand the first time they see them.', ['Wireframes', 'App and web design', 'Design systems']],
  ['SEO', 'Help the right people find you on Google.', ['Site audits', 'Keyword plans', 'Content and links']],
  ['Digital marketing', 'Ads and campaigns that are measured, not guessed.', ['Google and Meta ads', 'Email campaigns', 'Landing pages']],
  ['Social media marketing', 'A feed that looks like you and posts on time.', ['Content calendars', 'Reels and creatives', 'Community replies']],
  ['Mobile app development', 'Android and iPhone apps, from idea to store listing.', ['Android apps', 'iOS apps', 'App store launch']],
  ['AI automation', 'Let software handle the repetitive work.', ['Chatbots', 'WhatsApp automation', 'Workflow automation']],
  ['CRM systems', 'Every lead and customer in one place.', ['Lead tracking', 'Sales pipelines', 'Follow-up reminders']],
  ['HRM systems', 'Attendance, leave and payroll without spreadsheets.', ['Attendance', 'Leave and payroll', 'Employee records']],
  ['POS systems', 'Billing and stock for shops and restaurants.', ['Billing', 'Inventory', 'Sales reports']],
].map(([name, line, items]) => ({ name, line, items }))

export const SERVICES = SERVICE_INFO.map((s) => s.name)

// Sample entries: replace with the real ten projects.
export const PROJECTS = [
  ['Clinic booking app', 'Mobile app development'],
  ['Furniture store', 'Web development'],
  ['Restaurant POS', 'POS systems'],
  ['Sales pipeline CRM', 'CRM systems'],
  ['Staff attendance portal', 'HRM systems'],
  ['Support chatbot', 'AI automation'],
  ['Travel brand launch', 'Social media marketing'],
  ['Real estate search ranking', 'SEO'],
  ['Fitness app redesign', 'UI/UX design'],
  ['Festival sale campaign', 'Digital marketing'],
].map(([name, type]) => ({
  name,
  type,
  blurb: 'Sample entry. Replace with what you built, the result it got, and a link.',
}))

// Draft copy.
export const STEPS = [
  ['Brief', 'Tell us what you need. One call or one email is enough to start.'],
  ['Design', 'You see the screens before we write code, and change what you want.'],
  ['Build', 'We build it and show you progress as we go.'],
  ['Launch', 'We put it live, then stay around for fixes and upgrades.'],
]

// Draft copy.
export const REASONS = [
  ['One team', 'Design, code and marketing sit together, so nothing gets lost between vendors.', 'sun'],
  ['Built to be used', 'Big buttons, fast pages and plain words, because your customers are busy.', 'sky'],
  ['Software that fits', 'CRM, HRM and POS shaped around how your staff already work.', 'blue'],
  ['Here after launch', 'Fixes, updates and new ideas once the project is live.', 'navy'],
]

// Placeholders: replace with real client quotes.
export const VOICES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  quote: 'Sample note. A real client quote goes here.',
  who: 'Client name, business',
}))

// Draft copy.
export const FAQS = [
  ['How do we start?', 'Ring up the services you need on the till and email the order. We reply with questions, a plan and a price.'],
  ['Can you work on a website or app we already have?', 'Yes. Send us the link and tell us what is not working.'],
  ['Do you only build, or also run the marketing?', 'Both. The same team handles design, development, SEO, ads and social media.'],
  ['Will the CRM, HRM or POS fit how we work?', 'We set it up around your process and show your staff how to use it.'],
  ['What happens after launch?', 'We stay for fixes, updates and new features.'],
]

// From the Aknova Tech banner.
export const TAGLINE = "Powering what's next."
export const CONTACT = {
  phone: '+91 93184 86435',
  tel: '+919318486435',
  site: 'www.aknovatech.com',
  address: 'E-110, First Floor, Jeewan Park, Uttam Nagar East, Opp Hotel Plazzo Inn, Delhi 110059',
}

// Drop video files with these names into public/videos and they appear on the site.
export const VIDEOS = {
  why: ['why-1.mp4', 'why-2.mp4', 'why-3.mp4', 'why-4.mp4'],
  faq: 'faq.mp4',
}

// Sample plans: the prices are placeholders. Put your real numbers in `once` and `monthly`.
export const PLANS = [
  {
    name: 'Starter',
    line: 'A clean website that gets you found.',
    once: 'XX,XXX',
    monthly: 'X,XXX',
    items: ['Up to five pages', 'Works on every phone', 'Contact form', 'Basic SEO setup'],
    services: ['Web development', 'SEO'],
  },
  {
    name: 'Growth',
    line: 'The website, plus the marketing that fills it.',
    once: 'XX,XXX',
    monthly: 'XX,XXX',
    items: ['Everything in Starter', 'Online store or booking', 'Ads and social media setup', 'A report every month'],
    services: ['Web development', 'SEO', 'Digital marketing', 'Social media marketing'],
    best: true,
  },
  {
    name: 'Business suite',
    line: 'Software built around how you run things.',
    once: 'X,XX,XXX',
    monthly: 'XX,XXX',
    items: ['CRM, HRM or POS', 'AI automation', 'Staff training', 'Ongoing tech support'],
    services: ['CRM systems', 'HRM systems', 'POS systems', 'AI automation'],
  },
]

// Draft articles: edit, replace or add your own. `body` is a list of [heading, paragraph] pairs.
export const POSTS = [
  {
    id: 'how-to-brief-a-web-team',
    title: 'How to brief a web team in ten minutes',
    topic: 'Websites',
    tone: 'blue',
    minutes: 3,
    intro: 'A short, clear brief saves weeks. You do not need a long document, only honest answers to four questions.',
    body: [
      ['Who is it for?', 'Describe one real customer: what they do, what they are looking for, and what device they are probably holding. A site built for everyone works for no one.'],
      ['What should they do?', 'Pick one main action. Call you, book a slot, buy a product, or fill in a form. Every page should make that one action easy.'],
      ['What do you already have?', 'List your logo, photos, text, domain and any old site. Knowing what exists tells the team what must be made from scratch.'],
      ['How will you know it worked?', 'Choose a number you can check in three months: enquiries per week, orders per day, or calls from the site. That number guides every decision after launch.'],
    ],
  },
  {
    id: 'spreadsheet-or-crm',
    title: 'When a spreadsheet stops being enough',
    topic: 'Business software',
    tone: 'sun',
    minutes: 3,
    intro: 'Most businesses start by tracking customers in a spreadsheet, and that is fine. These are the signs it is time for a CRM.',
    body: [
      ['Leads are slipping', 'If someone enquired last week and nobody followed up, the sheet is not reminding anyone. A CRM does.'],
      ['Two people edit the same row', 'Once more than one person handles customers, you need to see who spoke to whom and when, without asking around.'],
      ['You cannot answer simple questions', 'How many enquiries came in this month? Where did they come from? How many became sales? If that takes an afternoon to work out, you have outgrown the sheet.'],
      ['Start small', 'A CRM does not need fifty fields. Begin with name, need, next step and date. Add more only when someone asks for it twice.'],
    ],
  },
  {
    id: 'what-to-automate-first',
    title: 'What to automate first in a small business',
    topic: 'AI automation',
    tone: 'sky',
    minutes: 4,
    intro: 'Automation pays off fastest on jobs that are frequent, boring and follow the same steps every time.',
    body: [
      ['Answering the same questions', 'Opening hours, prices, delivery areas. A chatbot on your site or WhatsApp can answer these at any hour and hand over to a person when it gets stuck.'],
      ['Following up', 'A message the day after an enquiry, a reminder before an appointment, a thank-you after a purchase. These are easy to automate and easy to forget by hand.'],
      ['Moving data between tools', 'If someone copies orders from a form into a sheet and then into billing, that is three chances for a typo. Connect the tools once and the copying stops.'],
      ['Keep a person in the loop', 'Automate the routine, not the judgement. Complaints, refunds and unusual requests should still reach a human quickly.'],
    ],
  },
]
