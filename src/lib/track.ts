/**
 * 익명 사용 통계 — 채록 서버의 track 함수로 보낸다 (앱과 같은 수집 경로).
 *
 * 페이지뷰·UV는 Vercel Analytics(쿠키리스)가 담당하고, 여기는 퍼널 이벤트
 * (담기 창 열림·저장 성공 등)만 센다. 처리방침 6조와 1:1 — installId는
 * 무작위 값으로 계정과 무관하고, 이벤트 이름·횟수 외에는 아무것도 싣지 않는다.
 */

const TRACK_URL = 'https://us-central1-chaerok-c0830.cloudfunctions.net/track';
const ID_KEY = 'chaerok-install-id';

function installId(): string {
  try {
    const saved = localStorage.getItem(ID_KEY);
    if (saved) return saved;
    const fresh = crypto.randomUUID();
    localStorage.setItem(ID_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

type Platform = 'web' | 'ext' | 'note';

/**
 * 경로 → 이벤트 이름 + 플랫폼. **정해진 목록에서만 고른다** — 경로를 그대로 보내면
 * 쿼리스트링(담기 창의 페이지 본문!)이 통계에 섞여 들어간다.
 *
 * ⚠️ 표면이 둘이라 플랫폼을 가른다: 소개(`/`)는 익명 획득이라 `web`, 노트 뷰어
 * (`/notes`)는 Pro 리텐션이라 `note`. 운영 콘솔이 방문 기기(UV)를 소개/노트로
 * 갈라 세운다(서버 track이 platform으로 UV·이벤트를 나눈다). 나머지 정적
 * 페이지(약관·처리방침 등)는 소개와 같은 획득 표면이라 `web`으로 둔다.
 *
 * ⚠️ UV는 그 기기의 **그날 첫 방문 표면**으로 잡힌다(서버가 installId당 하루
 * 한 번만 센다). 그래서 `note` UV는 "그날 첫 웹 접점이 노트였던 기기" 수이고,
 * 노트 페이지 조회 자체는 `pv_notes` 이벤트가 페이지뷰로 정확히 센다.
 */
const PAGE_EVENTS: Record<string, { name: string; platform: Platform }> = {
  '/': { name: 'pv_home', platform: 'web' },
  '/notes': { name: 'pv_notes', platform: 'note' },
  '/privacy': { name: 'pv_privacy', platform: 'web' },
  '/terms': { name: 'pv_terms', platform: 'web' },
  '/delete-account': { name: 'pv_delete_account', platform: 'web' },
  // '/save'는 여기 없다 — 담기 창은 Save.tsx가 save_open/save_done 퍼널로 따로 센다
};

export function trackPageView(pathname: string): void {
  const e = PAGE_EVENTS[pathname];
  if (e) trackEvent(e.name, e.platform);
}

/** 실패는 조용히 버린다 — 통계가 저장 흐름을 막으면 안 된다 */
export function trackEvent(name: string, platform: Platform = 'web'): void {
  if (import.meta.env.DEV) return;
  try {
    void fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installId: installId(), platform, events: [{ name, count: 1 }] }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
