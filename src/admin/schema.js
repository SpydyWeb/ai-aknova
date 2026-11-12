// What each admin screen edits, and the form fields it shows. Field types are drawn by fields.jsx.
import { MODEL_OPTIONS, TONES, serviceBlocks } from '../blocks.js'

const COLOURS = TONES.slice(1)

// Screens that edit one list in site.json.
export const LISTS = {
  services: {
    title: 'Services',
    intro: 'Each service gets its own page, a key on the order till and a 3D model. They appear everywhere services are listed.',
    noun: 'service',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Name', type: 'text', help: 'The page address is made from the name, so renaming a live service changes its link.' },
      { k: 'line', label: 'One-line description', type: 'area', rows: 2 },
      { k: 'items', label: 'What is included', type: 'strings', noun: 'item' },
      { k: 'model', label: '3D model', type: 'select', options: MODEL_OPTIONS },
      { k: 'image', label: 'Photo in "What we do" (optional)', type: 'media', kind: 'image', help: 'Shown in place of the 3D model when a visitor points at this service on the home page.' },
      { k: 'blocks', label: 'Sections of this service’s page', type: 'sections', help: 'The page shows these from top to bottom. Open one to edit it, use the arrows to reorder, or add new ones.' },
    ],
    blank: { name: 'New service', line: '', items: [], model: 'mark', image: '', blocks: serviceBlocks({ name: '' }), seo: { title: '', description: '' } },
  },
  projects: {
    title: 'Projects',
    intro: 'Your portfolio. Shown in the card deck on the home page and the grid on the Work page.',
    noun: 'project',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Project name', type: 'text' },
      { k: 'type', label: 'Kind of work', type: 'service' },
      { k: 'blurb', label: 'What you built and the result it got', type: 'area', rows: 3 },
      { k: 'image', label: 'Photo or screenshot', type: 'media', kind: 'image' },
      { k: 'link', label: 'Live link (optional)', type: 'text', placeholder: 'https://' },
      { k: 'tag', label: 'Small label on the card (optional)', type: 'text', help: 'For example the year or the client. Leave empty for none.' },
    ],
    blank: { name: 'New project', type: '', blurb: '', image: '', link: '', tag: '' },
  },
  plans: {
    title: 'Pricing plans',
    intro: 'Shown wherever a Pricing plans section is placed. Choosing a plan adds its services to the visitor’s order.',
    noun: 'plan',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Plan name', type: 'text' },
      { k: 'line', label: 'One-line description', type: 'text' },
      { k: 'once', label: 'One-time price', type: 'text', help: 'Only the number, for example 25,000. The ₹ sign is added for you.' },
      { k: 'monthly', label: 'Monthly care price', type: 'text' },
      { k: 'hourly', label: 'Hourly price', type: 'text', help: 'Shown when a visitor picks "Hourly". Leave empty to show "Ask us".' },
      { k: 'items', label: 'What is included', type: 'strings', noun: 'item' },
      { k: 'services', label: 'Services added to the order', type: 'services' },
      { k: 'best', label: 'Mark as "Most chosen"', type: 'bool' },
    ],
    blank: { name: 'New plan', line: '', once: '', monthly: '', hourly: '', items: [], services: [], best: false },
  },
  posts: {
    title: 'Blog articles',
    intro: 'Each article gets its own page. The first three appear in the "Latest three articles" section.',
    noun: 'article',
    name: (x) => x.title,
    of: [
      { k: 'title', label: 'Title', type: 'text' },
      { k: 'id', label: 'Address', type: 'slug', prefix: '/blog/', help: 'Leave empty to make it from the title. Changing it later breaks old links.' },
      { k: 'topic', label: 'Topic', type: 'text' },
      { k: 'tone', label: 'Card colour', type: 'select', options: COLOURS },
      { k: 'minutes', label: 'Minutes to read', type: 'number' },
      { k: 'date', label: 'Published on', type: 'date' },
      { k: 'cover', label: 'Cover photo (optional)', type: 'media', kind: 'image' },
      { k: 'intro', label: 'Introduction', type: 'area', rows: 3, help: 'Also used as the description in search results.' },
      {
        k: 'body',
        label: 'Parts of the article',
        type: 'items',
        noun: 'part',
        name: (x) => x.heading,
        of: [
          { k: 'heading', label: 'Heading', type: 'text' },
          { k: 'text', label: 'Text', type: 'area', rows: 6, help: 'Leave an empty line between paragraphs.' },
          { k: 'image', label: 'Photo under this part (optional)', type: 'media', kind: 'image' },
        ],
        blank: { heading: '', text: '', image: '' },
      },
    ],
    blank: { id: '', title: 'New article', topic: '', tone: 'blue', minutes: 3, date: '', cover: '', intro: '', body: [], seo: { title: '', description: '' } },
  },
  voices: {
    title: 'Client reviews',
    intro: 'Shown as notes visitors can drag around.',
    noun: 'review',
    name: (x) => x.who,
    of: [
      { k: 'quote', label: 'What they said', type: 'area', rows: 3 },
      { k: 'who', label: 'Who said it', type: 'text', placeholder: 'Name, business' },
    ],
    blank: { quote: '', who: '' },
  },
  faqs: {
    title: 'FAQs',
    intro: 'Questions and answers. Search engines and AI assistants read these as a list of facts about you, so answer plainly.',
    noun: 'question',
    name: (x) => x.q,
    of: [
      { k: 'q', label: 'Question', type: 'text' },
      { k: 'a', label: 'Answer', type: 'area', rows: 3 },
    ],
    blank: { q: '', a: '' },
  },
  reasons: {
    title: 'Why-us cards',
    intro: 'Flip cards: a video and a heading on the front, a sentence on the back.',
    noun: 'card',
    name: (x) => x.title,
    of: [
      { k: 'title', label: 'Front heading', type: 'text' },
      { k: 'text', label: 'Text on the back', type: 'area', rows: 3 },
      { k: 'tone', label: 'Colour', type: 'select', options: COLOURS },
      { k: 'video', label: 'Short silent video on the front', type: 'media', kind: 'video' },
    ],
    blank: { title: '', text: '', tone: 'sun', video: '' },
  },
  industries: {
    title: 'Industries',
    intro: 'The industries you work with. Shown wherever an "Industries we serve" section is placed, on the home page and service pages.',
    noun: 'industry',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Industry', type: 'text', placeholder: 'Real estate' },
      { k: 'text', label: 'One line about your work for them (optional)', type: 'text' },
      { k: 'image', label: 'Small photo or icon (optional)', type: 'media', kind: 'image' },
    ],
    blank: { name: '', text: '', image: '' },
  },
  certificates: {
    title: 'Certificates',
    intro: 'Badges and certificates shown in the footer of every page.',
    noun: 'certificate',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Name', type: 'text', placeholder: 'ISO 9001:2015', help: 'Read out to screen readers and shown when there is no picture.' },
      { k: 'image', label: 'Badge or certificate picture', type: 'media', kind: 'image' },
      { k: 'link', label: 'Link to check it (optional)', type: 'text', placeholder: 'https://' },
    ],
    blank: { name: '', image: '', link: '' },
  },
  steps: {
    title: 'Process steps',
    intro: 'How a project runs, in order. Used by both Process sections and on every service page.',
    noun: 'step',
    name: (x) => x.name,
    of: [
      { k: 'name', label: 'Step name', type: 'text' },
      { k: 'text', label: 'What happens', type: 'area', rows: 2 },
    ],
    blank: { name: '', text: '' },
  },
}

export const SITE_FIELDS = [
  { k: 'name', label: 'Company name', type: 'text' },
  { k: 'tagline', label: 'Tagline', type: 'text' },
  { k: 'url', label: 'Website address', type: 'text', placeholder: 'https://www.example.com', help: 'The address the site is live on. Search engines are told every page lives under it.' },
  { k: 'email', label: 'Email', type: 'text' },
  { k: 'phone', label: 'Phone', type: 'text' },
  { k: 'whatsapp', label: 'WhatsApp number', type: 'text', placeholder: '+91 98765 43210', help: 'Enquiries sent with the "Send on WhatsApp" buttons open a chat with this number. Include the country code. Leave empty to use the phone number above.' },
  { k: 'address', label: 'Full address, as shown on the site', type: 'area', rows: 2 },
  { k: 'street', label: 'Street part of the address', type: 'text', help: 'These four are given to search engines and maps.' },
  { k: 'locality', label: 'City', type: 'text' },
  { k: 'postcode', label: 'PIN code', type: 'text' },
  { k: 'country', label: 'Country code', type: 'text', placeholder: 'IN' },
  { k: 'city', label: 'City named in page titles', type: 'text', help: 'For example "Web development in Delhi". Leave empty to leave the city out.' },
  {
    k: 'social',
    label: 'Social profiles',
    type: 'items',
    noun: 'profile',
    name: (x) => x.label || x.url,
    of: [
      { k: 'label', label: 'Name', type: 'text', placeholder: 'Instagram' },
      { k: 'url', label: 'Link', type: 'text', placeholder: 'https://' },
    ],
    blank: { label: '', url: '' },
  },
  { k: 'web3formsKey', label: 'Web3Forms access key', type: 'text', help: 'Get a free key at web3forms.com using the inbox that should receive enquiries, and paste it here. Without it, the contact form opens the visitor’s own email app instead.' },
  {
    k: 'popup',
    label: 'Enquiry pop-up',
    type: 'group',
    of: [
      { k: 'show', label: 'Show the pop-up', type: 'bool', help: 'Opens once per visitor, 10 seconds after they arrive. Never on the contact page.' },
      { k: 'title', label: 'Heading', type: 'text', placeholder: 'Tell us what you need' },
      { k: 'text', label: 'Line under the heading', type: 'text', placeholder: 'We reply within one working day.' },
    ],
  },
  {
    k: 'status',
    label: 'Delivery status line',
    type: 'group',
    of: [
      { k: 'show', label: 'Show the status line', type: 'bool', help: 'Shown on the home page and the pop-up, for example "Last project delivered 4 days ago. 2 projects in the queue."' },
      { k: 'queue', label: 'Projects in the queue', type: 'number' },
      { k: 'minDays', label: 'Last delivery: fewest days ago', type: 'number', help: 'Each visitor sees a number of days picked between these two.' },
      { k: 'maxDays', label: 'Last delivery: most days ago', type: 'number' },
    ],
  },
  {
    k: 'reviews',
    label: 'Google reviews, above the footer',
    type: 'group',
    of: [
      { k: 'title', label: 'Heading', type: 'text', placeholder: 'What people say on Google' },
      { k: 'embed', label: 'Embed code', type: 'area', rows: 5, help: 'Paste the code from your reviews widget (Elfsight, Trustindex, EmbedSocial and others), or the <iframe> from Google Maps > Share > Embed a map. It runs on every page, so only paste code from a service you trust.' },
      { k: 'url', label: 'Link to all your Google reviews', type: 'text', placeholder: 'https://g.page/r/...' },
    ],
  },
  {
    k: 'closing',
    label: 'Band above the footer',
    type: 'group',
    of: [
      { k: 'title', label: 'Big line', type: 'text' },
      { k: 'button', label: 'Button text', type: 'text' },
    ],
  },
  {
    k: 'notFound',
    label: '"Page not found" screen',
    type: 'group',
    of: [
      { k: 'title', label: 'Heading', type: 'text' },
      { k: 'text', label: 'Text', type: 'text' },
      { k: 'button', label: 'Button text', type: 'text' },
    ],
  },
  {
    k: 'buddyTips',
    label: 'Tips from the robot in the corner',
    type: 'items',
    noun: 'tip',
    name: (x) => x.text,
    of: [
      { k: 'text', label: 'What it says', type: 'text' },
      { k: 'to', label: 'Where it takes the visitor', type: 'link' },
    ],
    blank: { text: '', to: '/' },
  },
]

export const SEO_FIELDS = [
  { k: 'indexing', label: 'Let search engines list this site', type: 'bool', help: 'Switch off while the site is unfinished. Every page is then marked "do not list".' },
  { k: 'image', label: 'Picture shown when a link is shared', type: 'media', kind: 'image', help: 'Used on WhatsApp, LinkedIn and others for any page without its own. Best at 1200 by 630 pixels.' },
  { k: 'googleVerification', label: 'Google Search Console code', type: 'text', help: 'In Search Console choose the "HTML tag" method and paste only the code inside content="...".' },
  { k: 'bingVerification', label: 'Bing Webmaster code', type: 'text' },
  { k: 'keywords', label: 'Keywords (optional)', type: 'text', help: 'Comma separated. Google ignores this; a few smaller engines still read it.' },
  { k: 'areaServed', label: 'Where you serve customers', type: 'text', placeholder: 'India' },
  { k: 'founded', label: 'Year the company started', type: 'text', placeholder: '2024' },
  { k: 'hours', label: 'Opening hours', type: 'text', placeholder: 'Mo-Sa 10:00-19:00' },
  { k: 'priceRange', label: 'Price range', type: 'text', placeholder: '₹₹' },
]

export const AI_FIELDS = [
  { k: 'summary', label: 'Who you are, in two sentences', type: 'area', rows: 3, max: 320, help: 'This is the paragraph an AI assistant is most likely to repeat when someone asks about you. Say what you do, for whom, and where. Leave empty to build it from your services.' },
  { k: 'facts', label: 'Facts worth quoting', type: 'strings', noun: 'fact', help: 'Short, checkable statements: years in business, number of projects, cities served, turnaround times, starting prices.' },
  { k: 'answers', label: 'Let AI assistants read the site to answer questions', type: 'bool', help: 'ChatGPT search, Claude and Perplexity fetch pages when a person asks something. Keep this on to be cited.' },
  { k: 'training', label: 'Let AI companies use the site to train models', type: 'bool', help: 'GPTBot, ClaudeBot, Google-Extended and others. Being in training data helps future models know you exist.' },
]
