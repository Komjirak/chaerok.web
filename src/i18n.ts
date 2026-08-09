import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';

export const LANG_STORAGE_KEY = 'chaerok-lang';

/** `/en`으로 시작하는 주소인가 — 주소가 언어를 정하는 유일한 근거다. */
export function isEnglishPath(pathname: string): boolean {
  return pathname === '/en' || pathname.startsWith('/en/');
}

/**
 * 저장된 선택. 없으면 null — "아직 아무것도 안 골랐다"와 "ko를 골랐다"를
 * 구분해야 자동 전환을 한 번만 할 수 있다.
 */
export function savedLanguage(): 'ko' | 'en' | null {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등)
  }
  return null;
}

/**
 * 지역(국가) 기준 판정 — 앱(src/i18n/deviceLanguage.ts)과 같은 규칙이다.
 * 언어가 아니라 지역 로캘을 보는 이유도 앱과 같다: 브라우저의 Intl 로캘이
 * OS 지역 설정을 반영하므로 "한국에 있는 사람"이라는 같은 의미가 된다.
 */
export function regionLanguage(): 'ko' | 'en' {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return locale.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  } catch {
    return 'ko';
  }
}

/**
 * 크롤러 판정 — 심사·검색 봇은 지역 이동의 대상이 아니다.
 *
 * 구글 OAuth 브랜드 심사는 미국에서 JS까지 렌더링해 홈페이지를 읽는다.
 * 저장된 선택이 없고 지역이 한국 밖이니 LanguageGate가 `/en`으로 옮겼고,
 * 심사는 영어 페이지("Chaerok")를 보고 "앱 이름('채록(chaerok)') 불일치 ·
 * 목적 설명 없음"으로 떨어졌다(08-09 실사고). 봇에게는 주소 그대로의
 * 언어를 보여준다 — hreflang이 이미 언어별 주소를 알려주고 있다.
 */
export function isCrawler(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return true;
  return /bot|spider|crawl|yeti|google-inspectiontool|chrome-lighthouse|slurp/i.test(
    navigator.userAgent,
  );
}

/**
 * 초기 언어 — **주소가 가장 세다.**
 *
 * 예전에는 주소가 하나뿐이라 로캘로만 정했는데, 그러면 미국 로캘로 도는
 * 구글봇에게 한국어 주소가 영어로 렌더링됐다(메타는 한국어인데 본문은 영어).
 * 이제 `/en`은 영어, 그 밖은 한국어로 고정하고, 저장된 선택이 없는 방문자만
 * App의 LanguageGate가 지역에 따라 `/en`으로 한 번 보낸다.
 */
function resolveInitialLanguage(): 'ko' | 'en' {
  if (typeof window === 'undefined') return 'ko';
  const { pathname } = window.location;
  if (isEnglishPath(pathname)) return 'en';
  /*
    담기 창과 생각 노트는 검색에 노출되지 않는 개인용 화면이라 주소에 언어를
    붙이지 않는다 — 여기서는 예전처럼 저장된 선택·지역을 따른다.
  */
  if (pathname === '/save' || pathname === '/notes') return savedLanguage() ?? regionLanguage();
  return 'ko';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en }
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
