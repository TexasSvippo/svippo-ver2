// Run with: node --test src/utils/sanitizeHtml.test.ts   (Node 24, no extra deps)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeDescriptionHtml } from './sanitizeHtml.ts'

const ALLOWED = ['p', 'strong', 'em', 'h3', 'ul', 'ol', 'li', 'br']

// ── Safety invariant ─────────────────────────────────────────────────────────
// Every '<' in the output must start an allowed tag with no attributes. Text
// '<' is escaped as &lt;. This check does not depend on any HTML parser, so it
// also holds for however a browser would parse the result (mXSS-safe).
const ALLOWED_TAG = new RegExp(`^</?(${ALLOWED.join('|')})\\s*/?>`)

function assertSafe(output: string, label: string) {
  for (let i = output.indexOf('<'); i !== -1; i = output.indexOf('<', i + 1)) {
    const rest = output.slice(i)
    assert.match(rest, ALLOWED_TAG, `${label}: unexpected markup at "${rest.slice(0, 40)}"`)
  }
  // Idempotent: sanitizing the output again changes nothing.
  assert.equal(sanitizeDescriptionHtml(output), output, `${label}: not idempotent`)
}

// ── DOM comparison ──────────────────────────────────────────────────────────
// Outputs only contain allowed tags without attributes (asserted above), so
// tokenizing tags + entity-decoded text compares the DOM exactly while
// ignoring serialization differences such as <br> vs <br />.
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: ' ' }

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const hex = e[1].toLowerCase() === 'x'
      return String.fromCodePoint(parseInt(e.slice(hex ? 2 : 1), hex ? 16 : 10))
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

function domTokens(html: string): string[] {
  const tokens: string[] = []
  for (const part of html.split(/(<\/?[a-z0-9]+\s*\/?>)/i)) {
    if (!part) continue
    const tag = part.match(/^<(\/?)([a-z0-9]+)/i)
    if (tag) {
      const name = tag[2].toLowerCase()
      if (!tag[1]) tokens.push(`<${name}>`)
      else if (name !== 'br') tokens.push(`</${name}>`)
    } else {
      const text = decode(part)
      const last = tokens.length - 1
      if (last >= 0 && tokens[last].startsWith('#')) tokens[last] += text // merge adjacent text
      else tokens.push('#' + text)
    }
  }
  return tokens
}

// ── 1. Malicious payloads ────────────────────────────────────────────────────
const PAYLOADS: Record<string, string> = {
  script: '<p>a</p><script>alert(1)</script><p>b</p>',
  scriptUpper: '<SCRIPT>alert(1)</SCRIPT><P>x</P>',
  scriptSplit: '<scr<script>ipt>alert(1)</scr</script>ipt>',
  doubleOpen: '<<script>alert(1)//<</script>',
  nullByte: '<scr\u0000ipt>alert(1)</scr\u0000ipt>',
  imgOnerror: '<img src=x onerror=alert(1)>text',
  imgNoQuotes: '<IMG SRC=javascript:alert(1)>',
  attrsOnAllowed: '<p onclick="alert(1)" style="color:red" class="x" id="y">p</p>',
  dataAriaAttrs: '<p data-x="javascript:alert(1)" aria-label="a" role="button">q</p>',
  jsLink: '<a href="javascript:alert(1)">klick</a>',
  jsLinkEntity: '<a href="&#106;avascript:alert(1)">klick</a>',
  jsLinkTab: '<a href="jav&#x09;ascript:alert(1)">klick</a>',
  dataUri: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">d</a>',
  iframe: '<iframe src="https://evil.example"></iframe>efter',
  iframeSrcdoc: '<iframe srcdoc="<script>alert(1)</script>">x</iframe>',
  svgOnload: '<svg onload=alert(1)><circle/></svg>svgtext',
  svgScript: '<svg><script>alert(1)</script><text>t</text></svg>',
  svgAnimate: '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
  style: '<style>body{display:none}</style><p>s</p>',
  styleUrl: '<p style="background:url(javascript:alert(1))">s</p>',
  mathml: '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  mxssNoscript: '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  mxssComment: '<p>a<!-- <img src=x onerror=alert(1)> --></p>',
  mxssCdata: '<p><![CDATA[<img src=x onerror=alert(1)>]]></p>',
  mxssTitle: '<title><img src=x onerror=alert(1)></title>',
  mxssTextarea: '<textarea><img src=x onerror=alert(1)></textarea>',
  mxssTemplate: '<template><img src=x onerror=alert(1)></template>t',
  mxssSelect: '<select><option><img src=x onerror=alert(1)></option></select>',
  detailsToggle: '<details open ontoggle=alert(1)>d</details>',
  bodyOnload: '<body onload=alert(1)>b</body>',
  base: '<base href="https://evil.example/">',
  meta: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  link: '<link rel="stylesheet" href="https://evil.example/x.css">',
  objectEmbed: '<object data="x"></object><embed src="y">',
  form: '<form action="https://evil.example"><input value="y"><button>b</button></form>',
  unclosedAttr: '<p title="x>y" onmouseover=alert(1)>z',
  long: '<p>' + 'a'.repeat(200_000) + '<script>alert(1)</script></p>',
}

const DANGEROUS = /<script|<iframe|<svg|<style|<img|<a[\s>]|\son\w+=|javascript:|style=|data-|aria-/i

for (const [name, payload] of Object.entries(PAYLOADS)) {
  test(`payload: ${name}`, () => {
    const out = sanitizeDescriptionHtml(payload)
    assertSafe(out, name)
    assert.doesNotMatch(out, DANGEROUS, name)
  })
}

test('null/undefined/empty give empty string', () => {
  assert.equal(sanitizeDescriptionHtml(null), '')
  assert.equal(sanitizeDescriptionHtml(undefined), '')
  assert.equal(sanitizeDescriptionHtml(''), '')
})

test('dropped-with-content tags leave no trace of their content', () => {
  assert.equal(sanitizeDescriptionHtml('<p>a</p><script>alert(1)</script><p>b</p>'), '<p>a</p><p>b</p>')
  assert.equal(sanitizeDescriptionHtml('<iframe src="x"></iframe>efter'), 'efter')
  assert.equal(sanitizeDescriptionHtml('<svg onload=alert(1)><circle/></svg>svgtext'), 'svgtext')
})

// ── 2. TipTap equivalence with the previous DOMPurify 3.4.14 config ─────────
// `expected` = DOMPurify.sanitize(input, { ALLOWED_TAGS, ALLOWED_ATTR: [] }),
// generated before the switch. prodDescription is a real description from
// svippo.se as it rendered in production.
const TIPTAP_FACIT: Record<string, { input: string; expected: string }> = {
  "fullDoc": {
    "input": "<p>Hej <strong>fet</strong> <em>kursiv</em><br>rad</p><h3>Rubrik</h3><ul><li><p>a</p></li></ul><ol><li><p>b</p></li></ol>",
    "expected": "<p>Hej <strong>fet</strong> <em>kursiv</em><br>rad</p><h3>Rubrik</h3><ul><li><p>a</p></li></ul><ol><li><p>b</p></li></ol>"
  },
  "swedish": {
    "input": "<p>Å Ä Ö å ä ö é – “citat” 100&nbsp;%</p>",
    "expected": "<p>Å Ä Ö å ä ö é – “citat” 100&nbsp;%</p>"
  },
  "escapedText": {
    "input": "<p>Pris: 5 &lt; 10 &amp;&amp; 10 &gt; 5</p>",
    "expected": "<p>Pris: 5 &lt; 10 &amp;&amp; 10 &gt; 5</p>"
  },
  "emptyParagraph": {
    "input": "<h3>Rubrik</h3><p></p><p>Tom rad ovan</p>",
    "expected": "<h3>Rubrik</h3><p></p><p>Tom rad ovan</p>"
  },
  "nestedList": {
    "input": "<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>",
    "expected": "<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>"
  },
  "boldItalic": {
    "input": "<p><strong><em>fet kursiv</em></strong></p>",
    "expected": "<p><strong><em>fet kursiv</em></strong></p>"
  },
  "lineBreaks": {
    "input": "<p>rad1<br>rad2<br><br>rad3</p>",
    "expected": "<p>rad1<br>rad2<br><br>rad3</p>"
  },
  "orderedStart": {
    "input": "<ol start=\"3\"><li><p>c</p></li></ol>",
    "expected": "<ol><li><p>c</p></li></ol>"
  },
  "unclosed": {
    "input": "<p><strong>ej stängd",
    "expected": "<p><strong>ej stängd</strong></p>"
  },
  "wrappers": {
    "input": "<div><span><p>inne</p></span></div>",
    "expected": "<p>inne</p>"
  },
  "prodDescription": {
    "input": "<p>Vi på <strong>GT</strong> har hjälpt över <strong>200 företag</strong> att utveckla sin digitala närvaro. Vi skapar moderna och genomtänkta hemsidor med fokus på design, användarvänlighet och resultat.<br></p><p><strong>Vad kan en ny hemsida göra för er?</strong></p><ul><li><p>Stärka företagets första intryck</p></li><li><p>Göra det enklare för kunder att hitta rätt</p></li><li><p>Öka antalet förfrågningar</p></li><li><p>Fungera lika bra på mobil som dator</p></li><li><p>Ge er en digital närvaro som speglar företaget</p></li></ul><p></p><p><strong>Så jobbar vi</strong></p><ol><li><p>Vi lär känna ert företag och undersöker marknaden.</p></li><li><p>Vi tar fram ett förslag baserat på er identitet och era mål.</p></li><li><p>Vi utvecklar sidan tillsammans med er tills vi når rätt resultat.</p></li></ol><p></p><p><strong>Just nu får ni 20% rabatt på en ny hemsida </strong>👋</p><p>Nyfiken på vad vi skulle kunna göra för er? Hör av er så tar vi ett kort och förutsättningslöst möte.</p>",
    "expected": "<p>Vi på <strong>GT</strong> har hjälpt över <strong>200 företag</strong> att utveckla sin digitala närvaro. Vi skapar moderna och genomtänkta hemsidor med fokus på design, användarvänlighet och resultat.<br></p><p><strong>Vad kan en ny hemsida göra för er?</strong></p><ul><li><p>Stärka företagets första intryck</p></li><li><p>Göra det enklare för kunder att hitta rätt</p></li><li><p>Öka antalet förfrågningar</p></li><li><p>Fungera lika bra på mobil som dator</p></li><li><p>Ge er en digital närvaro som speglar företaget</p></li></ul><p></p><p><strong>Så jobbar vi</strong></p><ol><li><p>Vi lär känna ert företag och undersöker marknaden.</p></li><li><p>Vi tar fram ett förslag baserat på er identitet och era mål.</p></li><li><p>Vi utvecklar sidan tillsammans med er tills vi når rätt resultat.</p></li></ol><p></p><p><strong>Just nu får ni 20% rabatt på en ny hemsida </strong>👋</p><p>Nyfiken på vad vi skulle kunna göra för er? Hör av er så tar vi ett kort och förutsättningslöst möte.</p>"
  }
}

for (const [name, { input, expected }] of Object.entries(TIPTAP_FACIT)) {
  test(`tiptap equivalence: ${name}`, () => {
    const out = sanitizeDescriptionHtml(input)
    assertSafe(out, name)
    assert.deepEqual(domTokens(out), domTokens(expected))
  })
}
