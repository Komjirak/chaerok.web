import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc } from 'firebase/firestore';
import { AlertTriangle, Check, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useChaerokSession } from '@/hooks/useChaerokSession';
import {
  auth,
  cleanUrlForDisplay,
  db,
  type NoteTag,
} from '@/lib/chaerok';
import logoImg from '@/assets/logo.png';
import appQr from '@/assets/app-qr.svg';
import { trackEvent } from '@/lib/track';

/**
 * 웹에서 담기 — 크롬 익스텐션이 여는 창.
 *
 * 왜 익스텐션이 직접 저장하지 않는가: MV3 서비스 워커에서는 Firebase 로그인
 * 팝업을 띄울 수 없고, 대안(chrome.identity)은 확장 ID가 박힌 별도 OAuth
 * 클라이언트를 미리 만들어야 한다. 이 페이지는 웹 뷰어와 **같은 출처·같은
 * 세션**을 쓰므로 이미 로그인한 사용자는 아무것도 더 하지 않아도 된다.
 * 익스텐션은 페이지를 긁어 쿼리로 넘기는 일만 한다.
 *
 * 저장 스키마는 앱의 upsertNoteFromRemote가 읽는 모양과 정확히 같아야 한다 —
 * 어긋나면 폰에서 빈 노트가 된다. 폴더·태그는 id가 아니라 **이름**으로 넘긴다.
 */

type Step = 'form' | 'busy' | 'done' | 'fail';

/**
 * 익스텐션이 넘긴 쿼리를 읽고 **즉시 주소창에서 지운다**.
 *
 * Firebase 로그인은 팝업·리다이렉트 모두 "돌아올 주소"로 현재 URL 전체를
 * 로그인 핸들러 URL에 실어 보낸다. 본문 쿼리가 12KB까지 갈 수 있어서 그대로
 * 두면 핸들러가 414(URI Too Long)를 뱉는다 — 로그아웃 상태에서 긴 페이지를
 * 담으려던 사용자가 정확히 이 벽에 부딪힌다. sessionStorage에 보관해 두므로
 * 새로 고침·모바일 리다이렉트 복귀에도 내용은 살아 있다.
 */
const PAYLOAD_KEY = 'chaerok:savePayload';

interface PagePayload {
  url: string;
  title: string;
  text: string;
}

function readPayloadOnce(): PagePayload {
  const qs = new URLSearchParams(window.location.search);
  if (qs.has('url') || qs.has('title') || qs.has('text')) {
    const p: PagePayload = {
      url: qs.get('url') ?? '',
      title: qs.get('title') ?? '',
      text: qs.get('text') ?? '',
    };
    try {
      sessionStorage.setItem(PAYLOAD_KEY, JSON.stringify(p));
    } catch {
      // 저장 실패(시크릿 모드 등)여도 이번 세션의 state로는 동작한다
    }
    window.history.replaceState(null, '', window.location.pathname);
    return p;
  }
  try {
    const stored = sessionStorage.getItem(PAYLOAD_KEY);
    if (stored) return JSON.parse(stored) as PagePayload;
  } catch {
    // 깨진 값은 빈 payload로 흘려보낸다
  }
  return { url: '', title: '', text: '' };
}

interface Analyzed {
  title: string;
  summary: string;
  tags: NoteTag[];
  folder: string;
}

export function Save() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { user, tier, loading, signIn, signOutNow, error: authError } = useChaerokSession(isEn);
  // 게으른 초기화 — 첫 렌더에서 딱 한 번 쿼리를 읽고 주소창을 비운다
  const [page] = useState(readPayloadOnce);

  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<Analyzed | null>(null);
  const [why, setWhy] = useState('');
  /**
   * 정리는 못 했지만 기록은 담긴 경우 — 서버가 조용히 거절했을 때(402)다.
   *
   * 이 화면은 지금까지 그런 경우에 **아무것도 저장하지 않고 실패**로 끝냈다.
   * 앱에서는 같은 상황에서 저장은 반드시 성공하고 품질만 낮아지는데
   * (Fail Soft, Not Loud), 웹만 담은 것을 통째로 버리고 있었다 —
   * 사용자 입장에서는 "담기 눌렀는데 사라졌다"이다.
   */
  const [savedUnorganized, setSavedUnorganized] = useState(false);

  useEffect(() => {
    document.title = isEn ? 'Save to Chaerok' : '채록에 담기';
  }, [isEn]);

  // 담기 퍼널의 시작점 — 성공(save_done)과 짝을 이뤄 이탈이 보인다
  useEffect(() => {
    trackEvent('save_open', 'ext');
  }, []);

  const save = async () => {
    // 긁어온 페이지 본문 — '원본'에 남는 값. 메모는 여기 섞지 않는다: 섞으면
    // 앱 상세 화면에서 요약·원문·메모가 같은 내용을 여러 번 보여준다
    // (모바일 앱의 memo 필드 분리와 같은 이유, src/agent/orchestrator.ts 참고).
    const pageContent = [page.text, page.title].filter(Boolean).join('\n\n').slice(0, 20_000);
    const trimmedMemo = memo.trim();
    // 분석 요청에는 메모를 맥락으로 얹는다 — "왜 담는지"를 알아야 제목·폴더·
    // 태그가 의도에 맞게 나온다. 저장되는 값과는 별개다.
    const analyzeInput = [trimmedMemo, pageContent].filter(Boolean).join('\n\n');
    if (!analyzeInput) {
      setWhy(isEn ? 'Nothing to save from this page.' : '담을 내용을 찾지 못했어요.');
      return setStep('fail');
    }

    setStep('busy');
    try {
      const token = await auth().currentUser!.getIdToken();
      // Cloud Function을 직접 부르면 크로스 오리진이라 preflight가 CORS 미설정으로 막힌다.
      // 같은 오리진의 /api/analyze로 보내고 vercel.json 리라이트가 서버 간에 대신 호출한다.
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: analyzeInput, sourceUrl: page.url || null, languageInstruction: '' }),
      });

      /*
        402·403은 서버가 조용히 거절한 것 — 문구만 오고 수치는 오지 않는다.

        **403(등급)과 402(예산 상한)의 처리가 다르다.**
        - 403은 여기까지 오지 않는 것이 정상이다. Pro가 아니면 아래 렌더가
          분석을 부르기 전에 안내 화면으로 막는다. 그래도 오면 실패로 끝낸다 —
          쓰기 권한이 없어 저장을 시도해 봐야 규칙에 막힌다.
        - 402는 **Pro인데 이번 달 상한에 닿은 것**이다. 쓰기 권한은 있으므로
          정리만 못 할 뿐 담기는 성공해야 한다(앱과 같은 Fail Soft).
      */
      if (res.status === 403) {
        const body = (await res.json().catch(() => ({}))) as { userMessage?: string };
        setWhy(body.userMessage ?? (isEn ? "We can't organize this right now." : '지금은 정리해 드릴 수 없어요.'));
        return setStep('fail');
      }
      const overBudget = res.status === 402;
      if (overBudget) {
        const body = (await res.json().catch(() => ({}))) as { userMessage?: string };
        setWhy(body.userMessage ?? (isEn ? 'Saved without sorting.' : '정리 없이 담아두었어요.'));
      }
      if (!res.ok) {
        setWhy(isEn ? "Chaerok couldn't read the page." : '채록이가 내용을 정리하지 못했어요.');
        return setStep('fail');
      }

      // 상한에 걸렸으면 응답 본문이 없다 — 페이지 제목만으로 기록을 세운다
      const r = overBudget
        ? ({} as Partial<Analyzed> & { tags?: NoteTag[] })
        : ((await res.json()) as Partial<Analyzed> & { tags?: NoteTag[] });
      const now = Date.now();
      const id = crypto.randomUUID();
      const analyzed: Analyzed = {
        title: r.title || page.title || (isEn ? 'Saved from the web' : '웹에서 담은 기록'),
        summary: r.summary || '',
        tags: Array.isArray(r.tags)
          ? r.tags.slice(0, 5).map((t) => ({ name: String(t.name), type: t.type ?? 'keyword' }))
          : [],
        folder: r.folder || '미분류',
      };

      await setDoc(doc(db(), 'notes', user!.uid, 'items', id), {
        createdAt: now,
        updatedAt: now,
        type: page.url ? 'url' : 'text',
        sourceApp: 'web-extension',
        // 페이지 내용이 없고 메모만 있는 경우(예: 빈 페이지·팝업만 열림) 원본을
        // 비우지 않는다 — 앱의 이미지+메모 전용 경로와 같은 처리
        rawContent: pageContent || trimmedMemo,
        memo: trimmedMemo || null,
        sourceUrl: page.url || null,
        title: analyzed.title,
        summary: analyzed.summary,
        folderName: analyzed.folder,
        tags: analyzed.tags,
        // 정리를 못 했으면 그 사실을 기록에도 남긴다 — 앱 상세에서 왜 요약이
        // 비었는지 읽을 수 있어야 한다
        processedByLayer: overBudget ? 'L1' : 'L2',
        processedByModel: overBudget ? 'web-raw' : 'chaerok-cloud',
      });

      setResult(analyzed);
      setSavedUnorganized(overBudget);
      setStep('done');
      trackEvent('save_done', 'ext');
    } catch {
      setWhy(isEn ? 'Connection dropped. Try again in a moment.' : '연결이 끊겼어요. 잠시 뒤 다시 시도해 주세요.');
      setStep('fail');
    }
  };

  return (
    <main className="min-h-dvh bg-surface-paper">
      <div className="max-w-md mx-auto px-6 py-6">
        <header className="flex items-center gap-2.5 pb-4 mb-5 border-b border-surface-amber/60">
          <img src={logoImg} alt="" className="w-6 h-6 object-contain" />
          <span className="font-serif font-semibold text-lg">
            {isEn ? 'Save to Chaerok' : '채록에 담기'}
          </span>
          {step === 'busy' ? <span className="ml-auto text-xs text-ink-muted">2 / 2</span> : null}
        </header>

        {loading ? null : !user ? (
          <Msg
            icon={<LogIn className="w-5 h-5" />}
            title={isEn ? 'Sign in first' : '로그인이 필요해요'}
            body={
              isEn
                ? 'Use the same account as your mobile device and it lands in the same notes.'
                : '모바일 채록에서 쓰던 계정으로 로그인하면 같은 생각 노트에 담겨요.'
            }
          >
            <Button className="w-full" onClick={signIn}>
              {isEn ? 'Sign in with Google' : 'Google로 로그인'}
            </Button>
            {authError ? <p className="mt-3 text-sm text-chaerok-800">{authError}</p> : null}
          </Msg>
        ) : tier !== 'pro' ? (
          // 로그인은 성공했지만 Pro가 아닌 경우 — 여기서 끝이 아니라 다음 할 일
          // (앱에서 구독)을 안내한다. 구독은 웹이 아니라 모바일 앱 안에서만
          // 시작할 수 있으므로 QR로 이어준다.
          <div className="text-center py-4">
            <div className="w-11 h-11 mx-auto mb-3.5 rounded-xl bg-surface-amber/60 grid place-items-center text-ink-muted">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-serif mb-2">
              {isEn ? 'Signed in — Chaerok Pro unlocks this' : '로그인 완료 — 채록 Pro에서 쓸 수 있어요'}
            </h2>
            <p className="text-sm text-ink-muted max-w-xs mx-auto leading-relaxed mb-2">
              {isEn
                ? 'Saving from the web and picking it up on your mobile device is a Pro feature.'
                : '웹에서 담은 기록을 계정에 보관하고 모바일에서 이어 보는 건 채록 Pro의 기능이에요.'}
            </p>
            {user.email ? (
              <p className="text-xs text-ink-muted/80 mb-5 break-all">
                {isEn ? `Signed in as ${user.email}` : `${user.email} 계정으로 로그인돼 있어요`}
              </p>
            ) : null}

            <div className="bg-surface-white border border-surface-amber rounded-xl px-4 py-4 mb-5 text-left flex items-center gap-4">
              <img
                src={appQr}
                alt={isEn ? 'QR code to the Chaerok app page' : '채록 앱 안내 QR 코드'}
                className="w-24 h-24 rounded-lg border border-surface-amber/60 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium mb-1">
                  {isEn ? 'Subscribe in the Chaerok app' : '구독은 채록 앱에서 시작해요'}
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {isEn
                    ? 'Scan with your phone camera to get the app, then subscribe in Settings → Chaerok Pro. Come back here with the same account.'
                    : '휴대폰 카메라로 QR을 찍어 앱을 받고, 설정 → 채록 Pro에서 구독을 시작하세요. 같은 계정으로 다시 오면 바로 담을 수 있어요.'}
                </p>
              </div>
            </div>

            <a href="/#pricing" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full mb-2.5">
                {isEn ? 'See plans' : '요금제 보기'}
              </Button>
            </a>
            <button
              type="button"
              onClick={signOutNow}
              className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink-dark"
            >
              {isEn ? 'Use a different account' : '다른 계정으로 로그인'}
            </button>
          </div>
        ) : step === 'form' ? (
          <>
            <div className="bg-surface-amber/30 border border-surface-amber/60 rounded-xl px-4 py-3.5 mb-4">
              <p className="text-sm font-medium line-clamp-2 mb-1">
                {page.title || (isEn ? '(untitled)' : '(제목 없음)')}
              </p>
              <p className="text-xs text-ink-muted line-clamp-1 break-all">
                {cleanUrlForDisplay(page.url)}
              </p>
            </div>

            <label className="block mb-5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                {isEn ? 'A note to go with it (optional)' : '함께 담을 메모 (선택)'}
              </span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                placeholder={
                  isEn
                    ? 'One line on why you are keeping this makes it far easier to find later'
                    : '이 페이지를 왜 담아두는지 한 줄 적어두면 나중에 훨씬 잘 찾아져요'
                }
                className="w-full bg-surface-white border border-surface-amber rounded-xl px-3.5 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-chaerok-600/40 resize-y"
              />
            </label>

            <Button className="w-full" onClick={save}>
              {isEn ? 'Let Chaerok organize it' : '채록이에게 정리 맡기기'}
            </Button>

            {/* 어느 계정의 생각 노트로 가는지 — 계정을 여럿 쓰는 사람이
                엉뚱한 곳에 담고 나서야 아는 것을 담기 전에 알게 한다 */}
            {user.email ? (
              <p className="mt-3 text-center text-xs text-ink-muted/80 break-all">
                {isEn
                  ? `Saves to ${user.email}`
                  : `${user.email} 계정의 생각 노트에 담겨요`}
              </p>
            ) : null}
          </>
        ) : step === 'busy' ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 mx-auto mb-4 rounded-full border-2 border-surface-amber border-t-chaerok-600 animate-spin" />
            <h2 className="text-lg font-serif mb-1.5">
              {isEn ? 'Chaerok is reading' : '채록이가 읽고 있어요'}
            </h2>
            <p className="text-sm text-ink-muted">
              {isEn ? 'Summarizing and adding tags.' : '내용을 정리해 제목과 태그를 붙이는 중이에요.'}
            </p>
          </div>
        ) : step === 'done' && result ? (
          <>
            <div className="text-center py-5 mb-4">
              <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-surface-amber grid place-items-center text-chaerok-600">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-serif">
                {isEn ? 'Saved to your notes' : '생각 노트에 담았어요'}
              </h2>
              {/*
                정리까지는 못 한 경우 — 담긴 것은 담긴 것이라 성공 화면을 쓰되,
                왜 요약이 비어 있는지 한 줄로 말한다. 서버가 준 문구를 그대로
                쓰므로 수치는 실리지 않는다(Silent Metering).
              */}
              {savedUnorganized && why ? (
                <p className="mt-2 text-sm text-ink-muted max-w-xs mx-auto leading-relaxed">{why}</p>
              ) : null}
            </div>
            <h3 className="font-serif text-xl leading-snug mb-2">{result.title}</h3>
            {result.summary ? (
              <p className="text-sm text-ink-muted whitespace-pre-wrap leading-relaxed mb-3.5">
                {result.summary}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {result.tags.map((t) => (
                <span
                  key={t.name}
                  className="text-xs px-2 py-0.5 rounded-full bg-surface-amber/70 text-chaerok-800 border border-surface-amber"
                >
                  {t.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-muted mb-5">
              {isEn ? `Filed under ${result.folder}` : `${result.folder} 폴더에 담겼어요`}
            </p>
            <a href="/notes" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">
                {isEn ? 'Open your notes' : '생각 노트에서 보기'}
              </Button>
            </a>
          </>
        ) : (
          <Msg
            icon={<AlertTriangle className="w-5 h-5" />}
            title={isEn ? "Couldn't save it" : '담지 못했어요'}
            body={why}
          >
            <Button variant="outline" className="w-full" onClick={() => setStep('form')}>
              {isEn ? 'Try again' : '다시 시도'}
            </Button>
          </Msg>
        )}
      </div>
    </main>
  );
}

function Msg({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="text-center py-8">
      <div className="w-11 h-11 mx-auto mb-3.5 rounded-xl bg-surface-amber/60 grid place-items-center text-ink-muted">
        {icon}
      </div>
      <h2 className="text-lg font-serif mb-2">{title}</h2>
      <p className="text-sm text-ink-muted max-w-xs mx-auto leading-relaxed mb-6">{body}</p>
      {children}
    </div>
  );
}
