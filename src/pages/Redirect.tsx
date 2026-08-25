/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `/r` — 공유 브랜드 리다이렉트.
 *
 * 왜 있는가: 기록을 공유하면 메신저가 링크를 긁어 큰 미리보기 카드를 만든다.
 * 예전엔 출처 URL을 그대로 공유해 **그 카드가 출처 사이트를 홍보**했다. 이제
 * 앱은 `chaerok.../r?u={원본}`을 공유하고, 이 페이지가:
 *   - 크롤러(카카오톡 등)에게는 프리렌더된 **브랜드 OG 카드**를 보여주고
 *     (`scripts/prerender.mjs`의 `/r` 항목 — 기록 내용은 카드에 없다),
 *   - 사용자는 `?u`의 **원본으로 넘긴다.**
 *
 * 아무것도 저장하지 않는다(stateless) — 목적지는 쿼리에 있고 서버 기록이 없다.
 * 오픈 리다이렉트 남용을 막으려고 **http/https만** 허용하고, 넘기기 전에
 * **목적지 도메인을 보여준다**(사용자가 어디로 가는지 눈으로 확인).
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { trackEvent } from '@/lib/track';

const SITE = 'https://chaerok.komjirak.studio';
/** 목적지 도메인을 한 박자 보여준 뒤 넘긴다 — 피싱 방어 겸 브랜드 접점. */
const REDIRECT_DELAY_MS = 900;

/** http/https만 통과시킨다 — `javascript:`·`data:`·상대경로는 거른다. */
function safeDestination(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

export function Redirect() {
  const { i18n } = useTranslation();
  const en = i18n.language === 'en';

  const dest = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return safeDestination(params.get('u'));
  }, []);

  const target = dest ? dest.href : en ? `${SITE}/en` : SITE;

  useEffect(() => {
    trackEvent('share_redirect', 'web');
    const t = setTimeout(() => window.location.replace(target), REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [target]);

  const t = en
    ? {
        kicker: 'Organized with Chaerok',
        going: dest ? 'Opening the original…' : 'Taking you to Chaerok…',
        at: 'at',
        now: 'Open now',
        brand: 'Chaerok · your second brain',
      }
    : {
        kicker: '채록으로 정리한 기록',
        going: dest ? '원문으로 이동하고 있어요…' : '채록으로 이동하고 있어요…',
        at: '이동할 곳',
        now: '지금 이동',
        brand: '채록 · 당신의 두 번째 뇌',
      };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-surface-paper px-6 text-center">
      <img src={logoImg} alt="채록" width={56} height={56} className="rounded-2xl" />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium tracking-wide text-chaerok-600">🧐 {t.kicker}</p>
        <p className="text-ink-dark/70 text-base">{t.going}</p>
      </div>

      {dest && (
        <p className="max-w-[80vw] truncate text-sm text-ink-dark/50">
          {t.at} <span className="font-medium text-ink-dark/80">{dest.hostname}</span>
        </p>
      )}

      <a
        href={target}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-chaerok-600 px-6 font-medium text-white transition-colors hover:bg-chaerok-800 focus:outline-none focus:ring-2 focus:ring-chaerok-600 focus:ring-offset-2 focus:ring-offset-surface-paper"
      >
        {t.now}
      </a>

      <p className="mt-2 text-xs text-ink-dark/40">{t.brand}</p>
    </main>
  );
}
