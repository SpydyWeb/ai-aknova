// Self-check for the text editor's format (src/rich.js). Run: node scripts/rich.test.mjs
import assert from 'node:assert/strict'
import { parse, plainText, richHtml } from '../src/rich.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const t = 'Hi **bold** *it* [site](https://x.com)\nline two\n\n## Sub\n- a\n- b\n\n1. one\n2. two'

assert.deepEqual(parse(t).map((b) => b.type), ['p', 'h', 'ul', 'ol'])
assert.equal(richHtml(t, esc), '<p>Hi <strong>bold</strong> <em>it</em> <a href="https://x.com">site</a><br />line two</p><h3>Sub</h3><ul><li>a</li><li>b</li></ul><ol><li>one</li><li>two</li></ol>')
assert.equal(plainText(t), 'Hi bold it site line two Sub a b one two')
// Old plain text reads exactly as before, and typed HTML stays text.
assert.equal(richHtml('one\n\ntwo <b>', esc), '<p>one</p><p>two &lt;b></p>')
// Only web, mail, phone and on-site links become links.
assert.ok(!richHtml('[x](javascript:alert)', esc).includes('href'))
console.log('rich.js ok')
