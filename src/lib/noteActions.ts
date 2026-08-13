import type { RemoteNote } from './chaerok';

/**
 * 기록 상세 행동 — 원문 번역·복사·공유.
 *
 * 앱 1.0.1 검토(앱 저장소 docs/V1_0_1_DIRECTION.md 2·4장)에서 설계한 기능을
 * **웹에 먼저** 붙인다(PO 결정 08-13). 데스크톱은 복사·공유가 더 흔한 자리이고,
 * 웹은 Vercel 배포라 스토어·OTA 없이 바로 내보내고 바로 되돌릴 수 있다.
 * 앱 쪽 구현은 앱 저장소 브랜치 이력에 있다 — 수요가 보이면 그대로 살린다.
 */

export type DetectedLang = 'ko' | 'en' | 'ja' | 'zh' | 'unknown';

/**
 * 스크립트(문자 체계) 기반 언어 감지 — 앱 src/agent/language.ts의 이식.
 * 문턱값까지 같아야 한다: 한쪽만 고치면 같은 글이 앱과 웹에서 다른 언어로
 * 판정돼 "앱엔 버튼이 있는데 웹엔 없다"가 된다.
 */
export function detectLang(text: string): DetectedLang {
  const sample = text.replace(/https?:\/\/\S+/g, ' ').slice(0, 4000);
  if (!sample.trim()) return 'unknown';

  let hangul = 0;
  let kana = 0;
  let han = 0;
  let latin = 0;

  for (const ch of sample) {
    const code = ch.codePointAt(0)!;
    if ((code >= 0xac00 && code <= 0xd7a3) || (code >= 0x1100 && code <= 0x11ff)) hangul++;
    else if ((code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff)) kana++;
    else if (code >= 0x4e00 && code <= 0x9fff) han++;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) latin++;
  }

  const total = hangul + kana + han + latin;
  if (total < 10) return 'unknown';
  if (hangul / total > 0.1) return 'ko';
  if (kana / total > 0.05) return 'ja';
  if (han / total > 0.2) return 'zh';
  if (latin / total > 0.5) return 'en';
  return 'unknown';
}

/**
 * 공유 본문 — 앱 src/agent/shareNote.ts(buildNoteShareText)와 같은 조립 규칙.
 * 제목·내 메모·요약·해시태그·출처 순서, 빈 칸은 줄을 만들지 않고 같은 말은
 * 한 번만 싣는다. 꼬리는 제품 목소리다(채록이의 1인칭 아님).
 */
export function buildNoteShareText(note: RemoteNote, isEn: boolean): string {
  const title = (note.title ?? '').trim();
  const memo = (note.memo ?? '').trim();
  const summary = (note.summary ?? '').trim();
  const tagLine = (note.tags ?? [])
    .map((t) => t.name.trim())
    .filter(Boolean)
    .map((t) => `#${t.replace(/\s+/g, '-')}`)
    .join(' ');
  const url = (note.sourceUrl ?? '').trim();

  const parts: string[] = [];
  if (title) parts.push(title);
  if (memo) parts.push(isEn ? `My note: ${memo}` : `내 메모: ${memo}`);
  if (summary && summary !== memo && summary !== title) parts.push(summary);
  if (tagLine) parts.push(tagLine);
  if (url) parts.push(isEn ? `Source: ${url}` : `출처: ${url}`);
  parts.push(
    isEn
      ? 'Organized with Chaerok · https://chaerok.komjirak.studio'
      : '채록에서 정리한 기록 · https://chaerok.komjirak.studio',
  );
  return parts.join('\n\n');
}

/** 서버 단건 크기 상한(MAX_CONTEXT_CHARS)과 같은 값 — 넘겨봐야 서버가 자른다 */
const TRANSLATE_MAX_CHARS = 100_000;

/** text가 null이면 실패 — message는 서버가 내려준 안내 문구(없으면 null) */
export interface TranslateResult {
  text: string | null;
  message: string | null;
}

/**
 * 원문 온디맨드 번역 — answer 함수의 mode:'translate' (추가형, 앱 1.0.1에서 신설).
 * Cloud Function을 직접 부르면 CORS preflight에 막힌다 — Save.tsx의 /api/analyze와
 * 같은 이유로 같은 오리진 /api/answer를 거치고 vercel.json 리라이트가 대신 부른다.
 * 402·403은 서버의 조용한 거절 — 문구만 오고 수치는 오지 않는다.
 */
export async function translateNote(
  rawContent: string,
  target: Exclude<DetectedLang, 'unknown'>,
  idToken: string,
): Promise<TranslateResult> {
  try {
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        mode: 'translate',
        context: rawContent.slice(0, TRANSLATE_MAX_CHARS),
        targetLanguage: target,
      }),
    });
    if (res.status === 402 || res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as { userMessage?: string };
      return { text: null, message: body.userMessage ?? null };
    }
    if (!res.ok) return { text: null, message: null };
    const body = (await res.json()) as { answer?: string };
    const text = (body.answer ?? '').trim();
    return { text: text || null, message: null };
  } catch {
    return { text: null, message: null };
  }
}
