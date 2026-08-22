/**
 * 빌드 뒤에 라우트별 정적 HTML을 만든다. 한국어(`/`)와 영어(`/en`) 두 벌.
 *
 * 왜 필요한가: 이 사이트는 클라이언트 렌더링 SPA다. `dist/index.html`의
 * `<div id="root">` 안은 로딩 표시뿐이고 본문은 JS가 실행돼야 생긴다.
 * 구글은 렌더링 큐를 거쳐 나중에라도 보지만, **네이버 Yeti와 AI 크롤러
 * (GPTBot·ClaudeBot·PerplexityBot 등)는 JS를 실행하지 않는다** — 그들에게
 * 이 사이트는 빈 페이지였다.
 *
 * 왜 언어별 URL인가: 예전에는 URL이 하나뿐이고 언어를 브라우저 로캘로 정했다.
 * 그래서 **미국 로캘로 도는 구글봇에게는 영어로 렌더링**되는데 정적 HTML과
 * 메타는 한국어라 서로 어긋났고, 영어 콘텐츠가 있어도 노출될 URL이 없었다.
 * 이제 언어마다 주소가 따로 있고 hreflang으로 서로를 가리킨다.
 *
 * ⚠️ 본문 문구는 **`src/locales/{ko,en}.json`에서 읽는다**. 여기에 카피를 새로
 * 적지 않는다 — 같은 문장을 두 곳에서 관리하면 반드시 어긋난다(웹·앱 법적
 * 고지에서 이미 겪었다). 제목·설명 같은 검색 메타만 여기서 정한다.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://chaerok.komjirak.studio';
/**
 * 링크 미리보기 이미지 — 언어별로 다른 파일을 쓴다(한국어 워드마크/영문 워드마크).
 * 스토어 피처 그래픽과 같은 얼굴이다. 만드는 법은 scripts/og-cover.py.
 */
const OG_IMAGE = { ko: `${SITE}/og-cover.png`, en: `${SITE}/og-cover-en.png` };

const L = {
  ko: JSON.parse(readFileSync(path.join(ROOT, 'src/locales/ko.json'), 'utf8')),
  en: JSON.parse(readFileSync(path.join(ROOT, 'src/locales/en.json'), 'utf8')),
};

/** 오늘 날짜(UTC, YYYY-MM-DD) — sitemap의 lastmod. 배포일이 곧 갱신일이다. */
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─────────────────────────────────────────────────────────────
// 본문 셸 — 로케일 문구로 조립한다
// ─────────────────────────────────────────────────────────────

const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function homeShell(lang) {
  const t = L[lang];
  const { hero, features, ontology, extension, pricing, privacy, faq, footer } = t;
  const home = lang === 'ko' ? '/' : '/en';
  return `
<header class="s-top">
  <p class="s-brand">채록(chaerok)</p>
</header>
<main>
  <h1>${esc(hero.title1)} ${esc(hero.title2)}</h1>
  <!-- OAuth 브랜드 심사가 홈에서 찾는 두 가지: 콘솔과 똑같은 앱 이름 + 목적 설명.
       문장은 검색 메타(META desc)를 재사용한다 — 새 카피를 만들지 않는다. -->
  <p class="s-lede">${esc(META[lang]['/'].desc)}</p>
  <p class="s-lede">${esc(hero.desc)}</p>
  <p class="s-note">${esc(hero.reassure)}</p>

  <section>
    <h2>${esc(features.title1)} ${esc(features.title2)}</h2>
    <p>${esc(features.desc)}</p>
    <h3>${esc(features.s1.title)}</h3><p>${esc(features.s1.desc)}</p>
    <h3>${esc(features.s2.title)}</h3><p>${esc(features.s2.desc)}</p>
    <h3>${esc(features.s3.title)}</h3><p>${esc(features.s3.desc)}</p>
  </section>

  <section>
    <h2>${esc(ontology.title1)} ${esc(ontology.title2)}</h2>
    <p>${esc(ontology.desc)}</p>
    <h3>${esc(ontology.l1.title)}</h3><p>${esc(ontology.l1.desc)}</p>
    <h3>${esc(ontology.l2.title)}</h3><p>${esc(ontology.l2.desc)}</p>
    <h3>${esc(ontology.l3.title)}</h3><p>${esc(ontology.l3.desc)}</p>
  </section>

  <section>
    <h2>${esc(privacy.title1)} ${esc(privacy.title2)}</h2>
    <p>${esc(privacy.desc)}</p>
    <h3>${esc(privacy.f1.title)}</h3><p>${esc(privacy.f1.desc)}</p>
    <h3>${esc(privacy.f2.title)}</h3><p>${esc(privacy.f2.desc)}</p>
    <h3>${esc(privacy.f3.title)}</h3><p>${esc(privacy.f3.desc)}</p>
  </section>

  <section>
    <h2>${esc(pricing.title)}</h2>
    <p>${esc(pricing.desc)}</p>
    <h3>${esc(pricing.free.name)} — ${esc(pricing.free.price)} (${esc(pricing.free.period)})</h3>
    <p>${esc(pricing.free.desc)}</p>
    ${list(pricing.free.features)}
    <h3>${esc(pricing.pro.name)} — ${esc(pricing.pro.price)} ${esc(pricing.pro.period)}</h3>
    <p>${esc(pricing.pro.desc)}</p>
    ${list(pricing.pro.features)}
    <p class="s-note">${esc(pricing.footnote)}</p>
  </section>

  <section>
    <h2>${esc(extension.title1)} ${esc(extension.title2)}</h2>
    <p>${esc(extension.desc)}</p>
    <h3>${esc(extension.app.title)}</h3><p>${esc(extension.app.desc)}</p>
    <h3>${esc(extension.ext.title)}</h3><p>${esc(extension.ext.desc)}</p>
    <h3>${esc(extension.web.title)}</h3><p>${esc(extension.web.desc)}</p>
  </section>

  <section>
    <h2>${esc(faq.title)}</h2>
    <h3>${esc(faq.q1)}</h3><p>${esc(faq.a1)}</p>
    <h3>${esc(faq.q2)}</h3><p>${esc(faq.a2)}</p>
    <h3>${esc(faq.q3)}</h3><p>${esc(faq.a3)}</p>
    <h3>${esc(faq.q4)}</h3><p>${esc(faq.a4)}</p>
    <h3>${esc(faq.q5)}</h3><p>${esc(faq.a5)}</p>
  </section>
</main>
<footer class="s-foot">
  <p>${esc(footer.desc)}</p>
  <p><a href="${home === '/' ? '' : home}/terms">${esc(footer.link.terms)}</a> · <a href="${home === '/' ? '' : home}/privacy">${esc(footer.link.privacy)}</a> · <a href="${home === '/' ? '' : home}/delete-account">${esc(footer.link.deleteAccount)}</a></p>
  <p>${esc(footer.copy)}</p>
</footer>`;
}

/** 법적 고지·안내 페이지 — 제목과 한 줄 안내만 심는다(본문 원본은 React 쪽에 있다). */
function pageShell(lang, heading, lede) {
  const home = lang === 'ko' ? '/' : '/en';
  return `
<header class="s-top"><p class="s-brand"><a href="${home}">채록(chaerok)</a></p></header>
<main>
  <h1>${esc(heading)}</h1>
  <p class="s-lede">${esc(lede)}</p>
</main>
<footer class="s-foot"><p>${esc(L[lang].footer.copy)}</p></footer>`;
}

// ─────────────────────────────────────────────────────────────
// 구조화 데이터 (JSON-LD)
// ─────────────────────────────────────────────────────────────

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: '꼼지락 스튜디오',
  alternateName: 'Komjirak Studio',
  url: SITE,
  logo: `${SITE}/icon-512.png`,
  email: 'komjirak.studio@gmail.com',
  // 스토어 링크는 **공개된 것만** 넣는다. App Store·Play는 출시 후 추가한다.
  sameAs: ['https://chromewebstore.google.com/detail/pnndjhdcffpjmekjiknakoakablpocli'],
};

const website = (lang) => ({
  '@type': 'WebSite',
  '@id': `${SITE}/#website-${lang}`,
  url: lang === 'ko' ? SITE : `${SITE}/en`,
  name: lang === 'ko' ? '채록(chaerok)' : 'Chaerok',
  inLanguage: lang === 'ko' ? 'ko-KR' : 'en',
  publisher: { '@id': `${SITE}/#org` },
});

const app = (lang) => {
  const t = L[lang];
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE}/#app`,
    name: lang === 'ko' ? '채록' : 'Chaerok',
    alternateName: lang === 'ko' ? 'Chaerok' : '채록',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'iOS, Android, Web',
    url: SITE,
    description: t.hero.desc,
    inLanguage: lang === 'ko' ? 'ko-KR' : 'en',
    publisher: { '@id': `${SITE}/#org` },
    // 평점은 넣지 않는다 — 실제 리뷰가 쌓이기 전의 aggregateRating은 거짓이다.
    offers: [
      { '@type': 'Offer', name: t.pricing.free.name, price: '0', priceCurrency: 'KRW', category: 'free' },
      {
        '@type': 'Offer',
        name: t.pricing.pro.name,
        price: '4900',
        priceCurrency: 'KRW',
        category: 'subscription',
        description: t.pricing.pro.desc,
      },
    ],
    featureList: [...t.pricing.free.features, ...t.pricing.pro.features],
  };
};

const faqLd = (lang) => {
  const t = L[lang].faq;
  return {
    '@type': 'FAQPage',
    '@id': `${SITE}/#faq-${lang}`,
    inLanguage: lang === 'ko' ? 'ko-KR' : 'en',
    mainEntity: [
      [t.q1, t.a1],
      [t.q2, t.a2],
      [t.q3, t.a3],
      [t.q4, t.a4],
      [t.q5, t.a5],
    ].map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
};

const jsonLd = (nodes) =>
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes,
  })}</script>`;

// ─────────────────────────────────────────────────────────────
// 라우트 표 — 경로 하나가 언어 두 벌을 낳는다
// ─────────────────────────────────────────────────────────────

const META = {
  ko: {
    '/': {
      // 네이버 서치어드바이저 권고 길이: 제목 40자·설명 80자 이내(08-09 진단 반영)
      title: '채록(chaerok) — 던지면 AI가 정리하는 당신의 두 번째 뇌',
      desc: '채록은 텍스트·링크·사진을 던지면 AI 에이전트 채록이가 요약·태그·분류하고 관련 기록끼리 이어주는 개인 지식관리(두 번째 뇌) 앱입니다.',
    },
    '/terms': {
      title: '이용약관 | 채록(chaerok)',
      desc: '채록 서비스 이용약관 — 서비스 제공 범위, 계정과 데이터, 구독과 결제, 서비스 변경·중단에 관한 조항입니다.',
      heading: '이용약관',
      lede: '채록 서비스 이용에 관한 약관입니다.',
    },
    '/privacy': {
      title: '개인정보처리방침 | 채록(chaerok)',
      desc: '채록 개인정보처리방침 — 기본은 기기에서 처리하고, 클라우드 처리는 사용자가 선택했을 때만 동작합니다. 수집 항목과 보관·파기 기준을 밝힙니다.',
      heading: '개인정보처리방침',
      lede: '기록은 기기 안에서 먼저 처리됩니다. 클라우드 처리는 사용자가 켰을 때만 동작합니다.',
    },
    '/delete-account': {
      title: '계정 삭제 안내 | 채록(chaerok)',
      desc: '채록 계정과 데이터를 삭제하는 방법 안내입니다. 앱 설정에서 직접 삭제할 수 있고, 삭제 시 지워지는 항목과 보관 기간을 함께 설명합니다.',
      heading: '계정 삭제',
      lede: '앱에서 직접 계정과 데이터를 삭제할 수 있습니다. 지워지는 항목과 절차를 안내합니다.',
    },
    '/notes': {
      title: '생각 노트 | 채록(chaerok)',
      desc: '로그인한 사용자의 기록을 읽는 화면입니다.',
      heading: '생각 노트',
      lede: '로그인하면 폰에서 담은 기록을 여기서 읽을 수 있습니다.',
      noindex: true,
    },
    '/save': {
      title: '채록에 담기',
      desc: '크롬 익스텐션이 여는 담기 창입니다.',
      heading: '채록에 담기',
      lede: '크롬 익스텐션이 여는 창입니다.',
      noindex: true,
    },
  },
  en: {
    '/': {
      title: 'Chaerok — The Second Brain That Files Itself | AI notes for links, screenshots, and stray thoughts',
      desc: "Drop in text, links, or photos and Chaerok's AI agent summarizes, tags, and connects them into notes you can find again. On-device by default, free to start.",
    },
    '/terms': {
      title: 'Terms of Service | Chaerok',
      desc: 'Chaerok Terms of Service — what the service provides, how accounts and data are handled, subscriptions and payment, and changes to the service.',
      heading: 'Terms of Service',
      lede: 'The terms that apply when you use Chaerok.',
    },
    '/privacy': {
      title: 'Privacy Policy | Chaerok',
      desc: 'Chaerok Privacy Policy — notes are processed on your device by default, and cloud processing runs only when you turn it on. What is collected, kept, and deleted.',
      heading: 'Privacy Policy',
      lede: 'Notes are processed on your device first. Cloud processing runs only when you turn it on.',
    },
    '/delete-account': {
      title: 'Delete Your Account | Chaerok',
      desc: 'How to delete your Chaerok account and data. You can delete it yourself in the app; this page explains what is removed and how long anything is kept.',
      heading: 'Delete your account',
      lede: 'You can delete your account and data from inside the app. Here is what gets removed.',
    },
    '/notes': {
      title: 'Notes | Chaerok',
      desc: 'Reading view for a signed-in user’s notes.',
      heading: 'Notes',
      lede: 'Sign in to read the notes you captured on your phone.',
      noindex: true,
    },
    '/save': {
      title: 'Save to Chaerok',
      desc: 'The capture window opened by the Chrome extension.',
      heading: 'Save to Chaerok',
      lede: 'This window is opened by the Chrome extension.',
      noindex: true,
    },
  },
};

const PATHS = ['/', '/terms', '/privacy', '/delete-account', '/notes', '/save'];
const CHANGEFREQ = { '/': 'weekly', '/terms': 'monthly', '/privacy': 'monthly', '/delete-account': 'yearly' };

/** 언어별 실제 주소. 한국어가 기본이라 접두어가 없다. */
const urlFor = (lang, p) => (lang === 'ko' ? p : p === '/' ? '/en' : `/en${p}`);

/** dist 안의 파일 경로. cleanUrls가 확장자를 감춰준다. */
const fileFor = (lang, p) => {
  if (lang === 'ko') return p === '/' ? 'index.html' : `${p.slice(1)}.html`;
  return p === '/' ? 'en.html' : `en${p}.html`;
};

// ─────────────────────────────────────────────────────────────
// 조립
// ─────────────────────────────────────────────────────────────

function head(lang, p) {
  const meta = META[lang][p];
  const url = `${SITE}${urlFor(lang, p)}`;
  const robots = meta.noindex
    ? '<meta name="robots" content="noindex, nofollow" />'
    : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />';

  /*
    hreflang은 색인되는 페이지에만 건다. x-default가 한국어 주소인 이유:
    그 주소가 저장된 선택이 없는 방문자를 지역에 따라 /en으로 보내는
    입구이기 때문이다 — x-default는 바로 그런 페이지를 가리키는 값이다.
  */
  const alternates = meta.noindex
    ? []
    : [
        `<link rel="alternate" hreflang="ko" href="${SITE}${urlFor('ko', p)}" />`,
        `<link rel="alternate" hreflang="en" href="${SITE}${urlFor('en', p)}" />`,
        `<link rel="alternate" hreflang="x-default" href="${SITE}${urlFor('ko', p)}" />`,
      ];

  const ld = p === '/' ? jsonLd([ORG, website(lang), app(lang), faqLd(lang)]) : '';

  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.desc)}" />`,
    robots,
    meta.noindex ? '' : `<link rel="canonical" href="${url}" />`,
    ...alternates,
    '<meta name="theme-color" content="#C9603A" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${lang === 'ko' ? '채록(chaerok)' : 'Chaerok'}" />`,
    `<meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : 'en_US'}" />`,
    `<meta property="og:locale:alternate" content="${lang === 'ko' ? 'en_US' : 'ko_KR'}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.desc)}" />`,
    `<meta property="og:image" content="${OG_IMAGE[lang]}" />`,
    `<meta property="og:image:secure_url" content="${OG_IMAGE[lang]}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:type" content="image/png" />',
    `<meta property="og:image:alt" content="${lang === 'ko' ? '채록 — 던지면 AI가 정리하는 두 번째 뇌' : 'Chaerok — the second brain that files itself'}" />`,
    /*
      카카오톡은 og:image의 **절대 URL과 크기 태그**를 보고 큰 카드로 그린다.
      상대경로나 크기 누락이면 작은 썸네일로 떨어진다(예전에 정사각 아이콘을
      상대경로로 두어 미리보기가 깨졌다). article:author는 카톡이 출처 줄에
      쓰는 값이라 브랜드명을 넣어 준다.
    */
    `<meta property="article:author" content="${lang === 'ko' ? '꼼지락 스튜디오' : 'Komjirak Studio'}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.desc)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE[lang]}" />`,
    ld,
  ]
    .filter(Boolean)
    .join('\n    ');
}

const HEAD_RE = /<!--seo:head:start-->[\s\S]*?<!--seo:head:end-->/;
const BODY_RE = /<!--seo:body:start-->[\s\S]*?<!--seo:body:end-->/;
const LANG_RE = /<html lang="[^"]*"/;

const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!HEAD_RE.test(template) || !BODY_RE.test(template)) {
  throw new Error('prerender: index.html에서 seo 마커를 찾지 못했습니다. index.html을 확인하세요.');
}

let count = 0;
for (const lang of ['ko', 'en']) {
  for (const p of PATHS) {
    const meta = META[lang][p];
    const shell = p === '/' ? homeShell(lang) : pageShell(lang, meta.heading, meta.lede);
    const html = template
      .replace(LANG_RE, `<html lang="${lang}"`)
      .replace(HEAD_RE, `<!--seo:head:start-->\n    ${head(lang, p)}\n    <!--seo:head:end-->`)
      .replace(BODY_RE, `<!--seo:body:start-->${shell}<!--seo:body:end-->`);
    const out = path.join(DIST, fileFor(lang, p));
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, html);
    count += 1;
  }
}
console.log(`prerender: ${count}개 페이지 (ko ${PATHS.length} · en ${PATHS.length})`);

// sitemap — 색인 대상만. 언어끼리 xhtml:link로 서로를 가리킨다.
const indexed = PATHS.filter((p) => !META.ko[p].noindex);
writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexed
  .flatMap((p) =>
    ['ko', 'en'].map(
      (lang) => `  <url>
    <loc>${SITE}${urlFor(lang, p)}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="${SITE}${urlFor('ko', p)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${urlFor('en', p)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${urlFor('ko', p)}"/>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${CHANGEFREQ[p]}</changefreq>
  </url>`,
    ),
  )
  .join('\n')}
</urlset>
`,
);
console.log(`prerender: sitemap.xml (${indexed.length * 2}개 URL)`);

// llms.txt — AI가 이 제품을 인용할 때 쓸 사실을 한곳에 모은다.
const ko = L.ko;
writeFileSync(
  path.join(DIST, 'llms.txt'),
  `# 채록 (Chaerok)

> ${META.ko['/'].desc}

만든 곳: 꼼지락 스튜디오(Komjirak Studio) · ${SITE}
플랫폼: iOS · Android · 웹 · 크롬 익스텐션
언어: 한국어 ${SITE}/ · English ${SITE}/en
갱신: ${TODAY}

## 무엇을 하는 앱인가

- 텍스트·URL·이미지를 던져 넣으면 AI 에이전트 "채록이"가 요약하고 태그를 달아 폴더로 분류한다.
- 관련된 기록끼리 이어 두고, 아침 브리핑으로 다시 꺼내 준다.
- OS 공유 시트("채록에 담기")와 크롬 익스텐션으로 어디서든 담을 수 있다.
- 정리 위치를 사용자가 고른다: **기본은 기기 안 처리**, 클라우드 처리는 켰을 때만 동작한다.

## 요금제

- ${ko.pricing.free.name}: ${ko.pricing.free.price} (${ko.pricing.free.period}) — ${ko.pricing.free.desc}
${ko.pricing.free.features.map((f) => `  - ${f}`).join('\n')}
- ${ko.pricing.pro.name}: ${ko.pricing.pro.price} ${ko.pricing.pro.period} — ${ko.pricing.pro.desc}
${ko.pricing.pro.features.map((f) => `  - ${f}`).join('\n')}

## 자주 묻는 질문

- ${ko.faq.q1} ${ko.faq.a1}
- ${ko.faq.q2} ${ko.faq.a2}
- ${ko.faq.q3} ${ko.faq.a3}
- ${ko.faq.q4} ${ko.faq.a4}
- ${ko.faq.q5} ${ko.faq.a5}

## In English

${META.en['/'].desc}

- Free plan: everything that runs on the device — capture, auto-tagging, on-device summaries, local semantic search.
- Chaerok Pro (₩4,900/month): long-context understanding, reading images, AI memory connections, cloud sync across devices.

## 링크

- 소개(한국어): ${SITE}/
- Overview (English): ${SITE}/en
- 이용약관: ${SITE}/terms · Terms: ${SITE}/en/terms
- 개인정보처리방침: ${SITE}/privacy · Privacy: ${SITE}/en/privacy
- 계정 삭제 안내: ${SITE}/delete-account · Delete account: ${SITE}/en/delete-account
- 크롬 익스텐션: https://chromewebstore.google.com/detail/pnndjhdcffpjmekjiknakoakablpocli
`,
);
console.log('prerender: llms.txt');
