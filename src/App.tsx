/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { Ontology } from '@/components/sections/Ontology';
import { Extension } from '@/components/sections/Extension';
import { Privacy } from '@/components/sections/Privacy';
import { Pricing } from '@/components/sections/Pricing';
import { FAQ } from '@/components/sections/FAQ';
import { Footer } from '@/components/layout/Footer';
import { Terms } from '@/pages/Terms';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { DeleteAccount } from '@/pages/DeleteAccount';
import { Notes } from '@/pages/Notes';
import { Save } from '@/pages/Save';
import { Redirect } from '@/pages/Redirect';

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trackPageView } from '@/lib/track';
import { isEnglishPath, savedLanguage, regionLanguage, isCrawler } from '@/i18n';

function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <main className="flex-1">
      {/* 전환 서사 순서 — 약속(히어로) → 작동 방식 → 돌려주는 뇌 → 신뢰(프라이버시)
          → 제안(요금제) → 생태계(모든 입구) → 반대 처리(FAQ). 익스텐션은 획득이
          아니라 리텐션 표면이라 요금제 뒤로 내렸다(docs/hero-redesign, 앱 저장소). */}
      <Hero />
      <Features />
      <Ontology />
      <Privacy />
      <Pricing />
      <Extension />
      <FAQ />
    </main>
  );
}

/**
 * 소개·문서·생각 노트는 공통 껍데기(헤더·푸터)를 쓴다.
 * /save는 익스텐션이 여는 작은 팝업 창이라 껍데기를 붙이지 않는다 —
 * 460px 폭에서 헤더와 푸터는 방해만 된다.
 */
function Shell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/*
        경로가 상대라서 이 표 하나가 `/`와 `/en` 아래에서 그대로 쓰인다 —
        영어용 화면을 따로 만들지 않는다(만들면 곧 어긋난다).
      */}
      <Routes>
        <Route path="" element={<Home />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="notes" element={<Notes />} />
        {/* Play·App Store가 요구하는 계정 삭제 안내 — 주소를 바꾸면 스토어 설정도 함께 고쳐야 한다 */}
        <Route path="delete-account" element={<DeleteAccount />} />
      </Routes>
      <Footer />
    </div>
  );
}

/**
 * 주소와 i18n 언어를 맞추고, 필요하면 언어별 주소로 한 번 보낸다.
 *
 * 규칙은 둘뿐이다.
 * 1. **주소가 언어를 정한다.** `/en/...`이면 영어, 그 밖은 한국어.
 *    한국어 주소를 영어로 렌더링하던 예전 방식이 구글봇에게 언어 불일치를
 *    만들었다(정적 HTML·메타는 한국어인데 렌더링 결과는 영어).
 * 2. **저장된 선택이 없는 방문자만** 지역에 따라 `/en`으로 한 번 옮긴다
 *    (PO 결정: 한국 외 지역은 영어로 맞이한다). `replace`로 보내 뒤로가기가
 *    무한 왕복이 되지 않게 한다. 한 번이라도 언어를 고른 사람은 옮기지 않는다.
 */
function LanguageGate() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const english = isEnglishPath(pathname);
  // 개인용 화면은 주소에 언어를 붙이지 않는다 — 저장된 선택·지역을 그대로 따른다
  // `/r`은 공유 리다이렉트라 언어별 주소로 튕기면 안 된다(넘길 목적지가 쿼리에 있다)
  const languageFreePath = pathname === '/save' || pathname === '/notes' || pathname === '/r';

  useEffect(() => {
    if (languageFreePath) return;
    const want = english ? 'en' : 'ko';
    if (i18n.language !== want) void i18n.changeLanguage(want);
  }, [english, languageFreePath, i18n]);

  useEffect(() => {
    if (english || languageFreePath) return;
    if (savedLanguage()) return;
    if (regionLanguage() === 'ko') return;
    // 봇은 옮기지 않는다 — OAuth 브랜드 심사가 /en으로 끌려가 한국어 홈의
    // 앱 이름·설명을 못 보는 실사고가 있었다(isCrawler 주석 참고)
    if (isCrawler()) return;
    navigate(`/en${pathname === '/' ? '' : pathname}`, { replace: true });
  }, [english, languageFreePath, pathname, navigate]);

  return null;
}

/**
 * 경로가 바뀔 때마다 페이지뷰를 센다. Vercel Analytics도 같은 것을 세지만,
 * 이쪽은 앱·익스텐션과 **같은 집계**로 들어가 운영 대시보드 한 곳에서 보인다.
 */
function PageViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PageViews />
      <LanguageGate />
      <Routes>
        <Route path="/save" element={<Save />} />
        {/* 공유 브랜드 리다이렉트 — 껍데기 없이 독립. 크롤러는 프리렌더된 브랜드 OG를 본다 */}
        <Route path="/r" element={<Redirect />} />
        {/* 언어별 주소. 두 갈래가 같은 Shell을 쓴다 */}
        <Route path="/en" element={<Shell />} />
        <Route path="/en/*" element={<Shell />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
      {/* 쿠키리스 페이지뷰·UV — Vercel 대시보드에서 Web Analytics를 켜야 수집된다 */}
      <Analytics />
    </BrowserRouter>
  );
}
