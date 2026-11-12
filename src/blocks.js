// The sections a page can be built from. The admin panel reads this list to draw its forms,
// components/Blocks.jsx draws them on the site, and seo.js turns them into plain HTML.

export const TONES = [
  ['paper', 'Light'],
  ['sun', 'Yellow'],
  ['sky', 'Sky blue'],
  ['blue', 'Blue'],
  ['navy', 'Navy'],
]

export const MODEL_OPTIONS = [
  ['mark', 'Aknova logo'],
  ['browser', 'Browser window'],
  ['phone', 'Phone'],
  ['magnifier', 'Magnifying glass'],
  ['megaphone', 'Megaphone'],
  ['heart', 'Heart'],
  ['robot', 'Robot'],
  ['cursor', 'Cursor arrow'],
  ['pawn', 'Chess pawn'],
  ['badge', 'ID badge'],
  ['coin', 'Coin'],
  ['envelope', 'Envelope'],
]

const title = { k: 'title', label: 'Heading', type: 'text' }
const text = { k: 'text', label: 'Line under the heading', type: 'area', rows: 2 }
const tone = { k: 'tone', label: 'Background colour', type: 'select', options: TONES, more: true }
const LOOKS = [
  ['cards', 'Separate cards'],
  ['cells', 'Joined boxes'],
  ['list', 'Compact list'],
]

export const BLOCKS = {
  /* ---------- sections you write yourself ---------- */
  pageHero: {
    label: 'Page header with 3D models',
    group: 'Write your own',
    about: 'A big heading with up to five floating 3D models beside it. Best as the first section.',
    fields: [
      title,
      { k: 'text', label: 'Introduction', type: 'area', rows: 3 },
      tone,
      { k: 'models', label: '3D models (up to five)', type: 'picks', options: MODEL_OPTIONS, max: 5 },
    ],
    blank: { title: 'Page heading', text: '', tone: 'paper', models: ['mark', 'browser', 'robot'] },
  },
  text: {
    label: 'Text',
    group: 'Write your own',
    about: 'A heading and paragraphs. Leave an empty line between paragraphs.',
    fields: [title, { k: 'body', label: 'Text', type: 'area', rows: 8 }],
    blank: { title: 'Heading', body: '' },
  },
  split: {
    label: 'Picture or video beside text',
    group: 'Write your own',
    about: 'Text on one side, a photo or video on the other.',
    fields: [
      title,
      { k: 'body', label: 'Text', type: 'area', rows: 5 },
      { k: 'media', label: 'Photo or video', type: 'media', kind: 'any' },
      { k: 'alt', label: 'Describe the picture (for search engines and screen readers)', type: 'text' },
      { k: 'points', label: 'Bullet points (optional)', type: 'strings', noun: 'point' },
      { k: 'flip', label: 'Put the picture on the left', type: 'bool', more: true },
      tone,
      { k: 'buttonLabel', label: 'Button text (optional)', type: 'text' },
      { k: 'buttonTo', label: 'Button goes to', type: 'link' },
    ],
    blank: { title: 'Heading', body: '', media: '', alt: '', points: [], flip: false, tone: 'paper', buttonLabel: '', buttonTo: '/contact' },
  },
  image: {
    label: 'Photo',
    group: 'Write your own',
    about: 'One large photo with an optional caption.',
    fields: [
      { k: 'src', label: 'Photo', type: 'media', kind: 'image' },
      { k: 'alt', label: 'Describe the picture (for search engines and screen readers)', type: 'text' },
      { k: 'caption', label: 'Caption (optional)', type: 'text' },
    ],
    blank: { src: '', alt: '', caption: '' },
  },
  gallery: {
    label: 'Photo gallery',
    group: 'Write your own',
    about: 'A grid of photos. Visitors tap one to see it large.',
    fields: [
      title,
      {
        k: 'images',
        label: 'Photos',
        type: 'items',
        noun: 'photo',
        name: (x) => x.alt || x.src,
        of: [
          { k: 'src', label: 'Photo', type: 'media', kind: 'image' },
          { k: 'alt', label: 'Describe the picture', type: 'text' },
        ],
        blank: { src: '', alt: '' },
      },
    ],
    blank: { title: '', images: [] },
  },
  video: {
    label: 'Video',
    group: 'Write your own',
    about: 'An uploaded video, or a YouTube or Vimeo link.',
    fields: [
      title,
      { k: 'src', label: 'Uploaded video', type: 'media', kind: 'video' },
      { k: 'embed', label: 'Or a YouTube / Vimeo link', type: 'text' },
      { k: 'loop', label: 'Play silently on repeat, without controls', type: 'bool', more: true },
      { k: 'caption', label: 'Caption (optional)', type: 'text' },
    ],
    blank: { title: '', src: '', embed: '', loop: false, caption: '' },
  },
  cards: {
    label: 'Cards',
    group: 'Write your own',
    about: 'A row of cards, each with a heading, a few words and an optional photo.',
    fields: [
      title,
      text,
      {
        k: 'cards',
        label: 'Cards',
        type: 'items',
        noun: 'card',
        name: (x) => x.title,
        of: [
          { k: 'title', label: 'Heading', type: 'text' },
          { k: 'text', label: 'Text', type: 'area', rows: 3 },
          { k: 'image', label: 'Photo (optional)', type: 'media', kind: 'image' },
          { k: 'tone', label: 'Colour', type: 'select', options: TONES, more: true },
          { k: 'to', label: 'Opens this page when tapped (optional)', type: 'link' },
        ],
        blank: { title: 'Card heading', text: '', image: '', tone: 'paper', to: '' },
      },
    ],
    blank: { title: 'Heading', text: '', cards: [] },
  },
  cta: {
    label: 'Call to action',
    group: 'Write your own',
    about: 'A coloured band with one message and one button.',
    fields: [title, text, tone, { k: 'buttonLabel', label: 'Button text', type: 'text' }, { k: 'buttonTo', label: 'Button goes to', type: 'link' }],
    blank: { title: 'Ready to start?', text: '', tone: 'sun', buttonLabel: 'Start a project', buttonTo: '/contact' },
  },

  /* ---------- sections a service page is built from (they work on any page) ---------- */
  svcHero: {
    label: 'Service header',
    group: 'Write your own',
    about: 'The opening of a service page: heading, introduction, buttons and a photo or the service’s 3D model. On a service page it also gets an "Add to order" button.',
    fields: [
      { k: 'title', label: 'Heading', type: 'text' },
      { k: 'highlight', label: 'Second line, on a coloured label (optional)', type: 'text' },
      { k: 'tone', label: 'Label colour', type: 'select', options: TONES.slice(1), more: true },
      { k: 'text', label: 'Introduction', type: 'area', rows: 3 },
      { k: 'ticks', label: 'Short promises under the buttons', type: 'strings', noun: 'promise' },
      { k: 'image', label: 'Photo (optional)', type: 'media', kind: 'image', help: 'Leave empty to show the service’s 3D model.' },
      { k: 'primaryLabel', label: 'Main button text', type: 'text' },
      { k: 'primaryTo', label: 'Main button goes to', type: 'link' },
      { k: 'secondaryLabel', label: 'Second button text (optional)', type: 'text' },
      { k: 'secondaryTo', label: 'Second button goes to', type: 'link' },
    ],
    blank: { title: 'Service name', highlight: '', tone: 'sun', text: '', ticks: [], image: '', primaryLabel: 'Start a project', primaryTo: '/contact', secondaryLabel: 'See our work', secondaryTo: '/work' },
  },
  intro: {
    label: 'Heading beside text',
    group: 'Write your own',
    about: 'A heading on the left and a few paragraphs on the right.',
    fields: [title, { k: 'body', label: 'Text', type: 'area', rows: 6, help: 'Leave an empty line between paragraphs.' }, tone],
    blank: { title: 'Heading', body: '', tone: 'paper' },
  },
  features: {
    label: 'Feature grid',
    group: 'Write your own',
    about: 'A heading and a set of short points, shown as cards, joined boxes or a compact list.',
    fields: [
      title,
      text,
      tone,
      { k: 'look', label: 'Look', type: 'select', options: LOOKS, more: true },
      {
        k: 'items',
        label: 'Points',
        type: 'items',
        noun: 'point',
        name: (x) => x.title,
        of: [
          { k: 'title', label: 'Heading', type: 'text' },
          { k: 'text', label: 'Text (optional)', type: 'area', rows: 2 },
          { k: 'to', label: 'Opens this page when tapped (optional)', type: 'link' },
        ],
        blank: { title: '', text: '', to: '' },
      },
      { k: 'buttonLabel', label: 'Button text (optional)', type: 'text' },
      { k: 'buttonTo', label: 'Button goes to', type: 'link' },
    ],
    blank: { title: 'Heading', text: '', tone: 'paper', look: 'cards', items: [], buttonLabel: '', buttonTo: '/contact' },
  },
  timeline: {
    label: 'Numbered steps',
    group: 'Write your own',
    about: 'Steps in order, numbered and joined by a line. Leave the steps empty to use the ones on the Process steps screen.',
    fields: [
      title,
      text,
      tone,
      {
        k: 'steps',
        label: 'Steps',
        type: 'items',
        noun: 'step',
        name: (x) => x.title,
        of: [
          { k: 'title', label: 'Step name', type: 'text' },
          { k: 'text', label: 'What happens', type: 'area', rows: 2 },
        ],
        blank: { title: '', text: '' },
      },
    ],
    blank: { title: 'How a project runs', text: '', tone: 'navy', steps: [] },
  },
  projects: {
    label: 'Projects of one kind',
    group: 'Write your own',
    about: 'Projects from the Projects screen, picked by kind of work. On a service page, leave the kind empty to show that service’s projects.',
    fields: [title, text, { k: 'service', label: 'Kind of work', type: 'service' }, { k: 'max', label: 'How many to show', type: 'number', more: true }],
    blank: { title: 'Projects', text: '', service: '', max: 3 },
  },
  questions: {
    label: 'Questions for this page',
    group: 'Write your own',
    about: 'Questions and answers written for this page only. Search engines read them as an FAQ.',
    fields: [
      title,
      text,
      {
        k: 'items',
        label: 'Questions',
        type: 'items',
        noun: 'question',
        name: (x) => x.q,
        of: [
          { k: 'q', label: 'Question', type: 'text' },
          { k: 'a', label: 'Answer', type: 'area', rows: 3 },
        ],
        blank: { q: '', a: '' },
      },
    ],
    blank: { title: 'Questions people ask', text: '', items: [] },
  },
  industries: {
    label: 'Industries we serve',
    group: 'Ready-made',
    about: 'Uses the list on the Industries screen.',
    fields: [title, text],
    blank: { title: 'Industries we serve', text: '' },
  },
  reviews: {
    label: 'Google reviews',
    group: 'Ready-made',
    about: 'The reviews widget and link set under Site details.',
    fields: [],
    blank: {},
  },

  /* ---------- ready-made interactive sections ---------- */
  hero: {
    label: 'Home hero with throwable toys',
    group: 'Ready-made',
    about: 'The big opening of the home page. The middle line cycles through the words you list.',
    fields: [
      { k: 'before', label: 'First line', type: 'text' },
      {
        k: 'words',
        label: 'Changing words',
        type: 'items',
        noun: 'word',
        name: (x) => x.text,
        of: [
          { k: 'text', label: 'Word', type: 'text' },
          { k: 'tone', label: 'Colour', type: 'select', options: TONES.slice(1) },
        ],
        blank: { text: '', tone: 'sun' },
      },
      { k: 'after', label: 'Last line', type: 'text' },
      { k: 'text', label: 'Introduction', type: 'area', rows: 3 },
      { k: 'primaryLabel', label: 'Main button text', type: 'text' },
      { k: 'primaryTo', label: 'Main button goes to', type: 'link' },
      { k: 'secondaryLabel', label: 'Second button text', type: 'text' },
      { k: 'secondaryTo', label: 'Second button goes to', type: 'link' },
    ],
    blank: { before: 'We build', words: [{ text: 'websites', tone: 'sun' }], after: 'people enjoy using.', text: '', primaryLabel: 'Start a project', primaryTo: '/contact', secondaryLabel: '', secondaryTo: '' },
  },
  marquee: { label: 'Scrolling strip of service names', group: 'Ready-made', about: 'Lists every service from the Services screen.', fields: [], blank: {} },
  services: { label: 'Service picker with 3D model', group: 'Ready-made', about: 'Shows the services from the Services screen, one 3D model at a time.', fields: [title, text], blank: { title: 'What we do', text: '' } },
  serviceGrid: { label: 'All services as cards', group: 'Ready-made', about: 'One card per service, each with an "Add to order" button.', fields: [], blank: {} },
  work: { label: 'Project card deck', group: 'Ready-made', about: 'The projects from the Projects screen as a deck visitors can fling through.', fields: [title, text], blank: { title: 'Our work', text: '' } },
  workGrid: { label: 'All projects with filters', group: 'Ready-made', about: 'Every project in a grid, with filter buttons.', fields: [], blank: {} },
  story: { label: 'Process, built in 3D while scrolling', group: 'Ready-made', about: 'Uses the steps from the Process steps screen. Scrolling assembles a 3D website.', fields: [title], blank: { title: 'How a project runs' } },
  process: { label: 'Process as a route', group: 'Ready-made', about: 'Uses the steps from the Process steps screen, drawn along a winding line.', fields: [title], blank: { title: 'How a project runs' } },
  why: { label: 'Why-us flip cards', group: 'Ready-made', about: 'Uses the cards from the Why-us cards screen.', fields: [title, text], blank: { title: 'Why work with us', text: 'Tap a card to turn it over.' } },
  pricing: { label: 'Pricing plans', group: 'Ready-made', about: 'Uses the plans from the Pricing screen.', fields: [title, text], blank: { title: 'Pick a plan, or build your own', text: '' } },
  voices: { label: 'Client reviews board', group: 'Ready-made', about: 'Uses the reviews from the Client reviews screen as notes visitors can drag.', fields: [title, text], blank: { title: 'What clients say', text: '' } },
  till: { label: 'Order till', group: 'Ready-made', about: 'Visitors press service keys, the till prints an order and sends it to you.', fields: [title, text], blank: { title: 'Ring up what you need', text: '' } },
  blog: { label: 'Latest three articles', group: 'Ready-made', about: 'Uses the newest articles from the Blog screen.', fields: [title], blank: { title: 'From the blog' } },
  blogGrid: { label: 'All articles', group: 'Ready-made', about: 'Every article from the Blog screen.', fields: [], blank: {} },
  faq: {
    label: 'Questions and answers',
    group: 'Ready-made',
    about: 'Uses the questions from the FAQs screen, with a video beside them.',
    fields: [title, { k: 'video', label: 'Video beside the questions', type: 'media', kind: 'video' }],
    blank: { title: 'Questions people ask first', video: '' },
  },
  contact: { label: 'Contact form', group: 'Ready-made', about: 'The enquiry form with your phone, email and address beside it.', fields: [title], blank: { title: "Tell us what you're building" } },
}

export const paragraphs = (s) =>
  String(s || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

// Turns a YouTube or Vimeo page link into the address a player frame needs.
export function embedUrl(link) {
  const s = String(link || '').trim()
  const yt = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return ''
}

export const isVideo = (f) => /\.(mp4|webm|mov|m4v)$/i.test(String(f || ''))

let n = 0
const bid = () => `s${Date.now().toString(36)}${(n++).toString(36)}`

// The sections a service page starts with, built only from what the Services screen already holds.
export const serviceBlocks = (s) => [
  { id: bid(), type: 'svcHero', ...BLOCKS.svcHero.blank, title: s.name, text: s.line || '', ticks: [...(s.items || [])] },
  { id: bid(), type: 'features', ...BLOCKS.features.blank, title: 'What is included', items: (s.items || []).map((t) => ({ title: t, text: '', to: '' })) },
  { id: bid(), type: 'timeline', ...BLOCKS.timeline.blank },
  { id: bid(), type: 'projects', ...BLOCKS.projects.blank, title: s.name ? `${s.name} projects` : 'Our work' },
  { id: bid(), type: 'industries', ...BLOCKS.industries.blank },
  { id: bid(), type: 'questions', ...BLOCKS.questions.blank, title: s.name ? `Questions about ${s.name}` : 'Questions people ask' },
]
