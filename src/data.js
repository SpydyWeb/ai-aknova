export const EMAIL = 'hello@example.com'

export const C = {
  paper: '#FFF4DC',
  ink: '#17130E',
  tangerine: '#FF5B1F',
  sun: '#FFC933',
  grape: '#6B4BFF',
  mint: '#1FD6A2',
}

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
  ['Built to be used', 'Big buttons, fast pages and plain words, because your customers are busy.', 'mint'],
  ['Software that fits', 'CRM, HRM and POS shaped around how your staff already work.', 'tangerine'],
  ['Here after launch', 'Fixes, updates and new ideas once the project is live.', 'grape'],
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
