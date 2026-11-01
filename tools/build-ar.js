// Builds ar/index.html from index.html: the same page, translated with the
// AR dictionary already in index.html, so search engines can index Arabic.
// Run from the repo root after any change to index.html:  node tools/build-ar.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Pull the AR dictionary out of the page script.
const m = src.match(/\nvar AR=(\{[\s\S]*?\n\});\n/);
if (!m) throw new Error('AR dictionary not found in index.html');
const AR = Function('return ' + m[1])();

const HEAD = {
  title: 'رامي وهبي للتصوير | مصوّر أعراس وجلسات خارجية في لبنان',
  description: 'رامي وهبي للتصوير: تصوير أعراس وبورتريه وجلسات خارجية في لبنان. صور أنيقة، صادقة، وخالدة. احجز عبر واتساب.',
  ogTitle: 'رامي وهبي للتصوير | مصوّر أعراس في لبنان',
  ogDescription: 'تصوير أعراس وبورتريه وجلسات خارجية في لبنان مع رامي وهبي.',
  url: 'https://ramiwehbi.com/ar/',
};

// Image descriptions, in page order of img[data-photo].
const ALT = [
  'عروس تمدّ يدها نحو الكاميرا بفستان مطرّز وطرحة دانتيل',
  'عروس مبتسمة تتّكئ على مكتب أثري مذهّب',
  'عروس تمسك طرحتها الدانتيل بضوء دافئ على درج فخم',
  'العروسان وجهاً لوجه قرب نافذة بستائر',
  'عروس بفستان ساتان منفوش أسفل درج رخامي',
  'عروس تنظر إلى الكاميرا خلف العريس ببدلة سوداء',
  'عروس تسند رأسها على كتف العريس',
  'عروس وعريس يضحكان على تراس مشمس في بيروت',
  'عروس بفستان طويل أمام واجهة قصر بيضاء',
  'مشهد في ساحة أوروبية قديمة، جلسة تصوير خارجية',
  'عروس من الخلف بفستان مطرّز مفتوح الظهر على درج قصر',
  'عروس على ضوء الشموع على درج كبير',
  'عروس بفستان تول في غرفة زجاجية مشمسة',
  'بورتريه عروس جالسة بضوء النافذة الناعم',
  'عروس تلتفّ بفستان تول والطرحة تلتقط الضوء',
  'التحضيرات: العروس جالسة بضوء النافذة الناعم',
  'الإكليل: ضوء الشموع على الدرج الكبير',
  'صور العروسين وقت الغروب على تراس في بيروت',
  'السهرة: مفرقعات فوق النافورة',
  '',
  'رامي وهبي، مصوّر أعراس وبورتريه في لبنان',
];

(async () => {
  const browser = await chromium.launch();
  // Scripts stay off so we serialize the page exactly as written, only translated.
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.setContent(src, { waitUntil: 'domcontentloaded' });
  const html = await page.evaluate(({ AR, HEAD, ALT }) => {
    const $ = (s) => document.querySelector(s);
    const setAttr = (s, a, v) => { const el = $(s); if (!el) throw new Error('missing ' + s); el.setAttribute(a, v); };
    const d = document.documentElement;
    d.lang = 'ar';
    d.dir = 'rtl';
    document.title = HEAD.title;
    setAttr('meta[name="description"]', 'content', HEAD.description);
    setAttr('link[rel="canonical"]', 'href', HEAD.url);
    setAttr('meta[property="og:title"]', 'content', HEAD.ogTitle);
    setAttr('meta[property="og:description"]', 'content', HEAD.ogDescription);
    setAttr('meta[property="og:url"]', 'content', HEAD.url);
    setAttr('meta[name="twitter:title"]', 'content', HEAD.ogTitle);
    setAttr('meta[name="twitter:description"]', 'content', HEAD.ogDescription);
    const loc = document.createElement('meta');
    loc.setAttribute('property', 'og:locale');
    loc.setAttribute('content', 'ar_LB');
    $('meta[property="og:type"]').after(loc);

    const missing = [];
    Object.keys(AR).forEach((sel) => { const el = $(sel); if (el) el.innerHTML = AR[sel]; else missing.push(sel); });
    if (missing.length) throw new Error('selectors not found: ' + missing.join(', '));

    const imgs = document.querySelectorAll('img[data-photo]');
    if (imgs.length !== ALT.length) throw new Error('expected ' + ALT.length + ' photos, found ' + imgs.length);
    imgs.forEach((img, i) => { img.alt = ALT[i]; });

    ['عرس', 'جلسة خارجية', 'جلسة بورتريه', 'ريل'].forEach((t, i) => { $('#f-type').options[i].text = t; });
    setAttr('#f-story', 'placeholder', 'الصالة، عدد المعازيم، الستايل اللي بتحبّوه…');

    const lang = $('#lang-btn');
    lang.href = '/';
    lang.hreflang = 'en';
    lang.lang = 'en';
    lang.setAttribute('aria-label', 'English version');
    lang.textContent = 'EN';
    return '<!DOCTYPE html>\n' + d.outerHTML + '\n';
  }, { AR, HEAD, ALT });
  await browser.close();

  fs.mkdirSync(path.join(root, 'ar'), { recursive: true });
  fs.writeFileSync(path.join(root, 'ar', 'index.html'), html);
  console.log('wrote ar/index.html (' + html.length + ' bytes)');
})().catch((e) => { console.error(e); process.exit(1); });
