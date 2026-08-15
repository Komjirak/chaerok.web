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
  const { user, tier, subscribedBefore, loading, signIn, signOutNow, error: authError } =
    useChaerokSession(isEn);
  // 게으른 초기화 — 첫 렌더에서 딱 한 번 쿼리를 읽고 주소창을 비운다
  const [page] = useState(readPayloadOnce);

  const [memo, setMemo] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<Analyzed | null>(null);
  const [why, setWhy] = useState('');
  /*
    서버가 등급으로 거절했을 때만 켠다 — 화면이 미리 판단하지 않는다.
    무료 계정도 평생 체험분이 남아 있으면 그대로 담기므로, 눌러 보기 전에는
    잠겼는지 알 수 없다(그리고 남은 횟수는 어디에도 보여주지 않는다).
  */
  const [locked, setLocked] = useState(false);

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

        **여기가 유일한 잠금 판정이다(08-15).** 예전에는 화면이 `tier !== 'pro'`로
        미리 막아, 무료 계정은 담기 버튼을 눌러 볼 수조차 없었다. 그러면
        서버가 여는 평생 체험분에 영영 닿지 못한다 — 강제는 서버 한 곳이라는
        원칙(server/src/entitlement.ts 머리주석)을 화면이 앞질러 어긴 셈이었다.
        이제 눌러 보고, 서버가 거절할 때만 잠금 화면으로 간다.
      */
      if (res.status === 402 || res.status === 403) {
        const body = (await res.json().catch(() => ({}))) as { userMessage?: string };
        setWhy(body.userMessage ?? (isEn ? "We can't organize this right now." : '지금은 정리해 드릴 수 없어요.'));
        setLocked(true);
        return;
      }
      if (!res.ok) {
        setWhy(isEn ? "Chaerok couldn't read the page." : '채록이가 내용을 정리하지 못했어요.');
        return setStep('fail');
      }

      const r = (await res.json()) as Partial<Analyzed> & { tags?: NoteTag[] };
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
        processedByLayer: 'L2',
        processedByModel: 'chaerok-cloud',
      });

      setResult(analyzed);
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
        ) : locked ? (
          /*
            서버가 거절했을 때의 화면 — 다음 할 일(앱에서 체험 시작)을 안내한다.
            구독은 웹이 아니라 모바일 앱 안에서만 시작할 수 있어 QR로 이어준다.

            ⚠️ **제목이 도달 경로를 따라야 한다 (PO 지적 08-15).** 예전에는
            "로그인 완료 — …"였는데, 그건 **로그인 직후에만 이 화면에 닿던
            시절의 말**이다. 지금은 무료 다섯 번을 다 쓴 사람이 오므로, 이미
            로그인해 쓰고 있던 사람에게 "로그인 완료"라고 하는 셈이었다.
            바로 아래 "…계정으로 로그인돼 있어요" 줄과도 겹친다.

            ⚠️ **Pro 사용자도 여기 올 수 있다.** 예산 상한(hard cap)에 걸리면
            서버가 같은 402를 준다 — 거의 없는 일이지만, 그 사람에게 "체험을
            다 쓰셨어요"는 틀린 말이고 QR로 구독을 권하는 것은 더 틀렸다.
            그래서 등급으로 갈라, Pro에게는 **서버가 준 문구를 그대로** 보인다.
          */
          <div className="text-center py-4">
            <div className="w-11 h-11 mx-auto mb-3.5 rounded-xl bg-surface-amber/60 grid place-items-center text-ink-muted">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-serif mb-2">
              {tier === 'pro'
                ? isEn
                  ? 'Not right now'
                  : '지금은 정리해 드릴 수 없어요'
                : isEn
                  ? "That's the five free ones"
                  : '무료로 드린 다섯 번을 다 쓰셨어요'}
            </h2>
            <p className="text-sm text-ink-muted max-w-xs mx-auto leading-relaxed mb-2">
              {/*
                ⚠️ **체험은 계정당 한 번뿐이다 (PO 지적 08-15).** 구독했다
                해지한 사람에게 "2주 무료 체험을 시작하세요"라고 하면 거짓말이
                된다 — 스토어는 그 계정에 체험을 다시 주지 않는다. 결제 시트를
                열면 바로 청구가 뜨므로 우리 문구만 앞서 나가는 꼴이다.
                이력이 있으면 체험을 빼고 다시 구독하는 말로 바꾼다.
              */}
              {tier === 'pro'
                ? why
                : subscribedBefore
                  ? isEn
                    ? 'To keep saving, resubscribe to Chaerok Pro in the app. You can cancel anytime.'
                    : '계속 담으시려면 채록 앱에서 채록 Pro를 다시 시작해 주세요. 언제든 해지할 수 있어요.'
                  : isEn
                    ? 'To keep saving, start the 2-week free trial in the Chaerok app. Nothing is charged during the trial, and you can cancel anytime.'
                    : '계속 담으시려면 채록 앱에서 2주 무료 체험을 시작해 주세요. 체험 기간에는 요금이 청구되지 않고, 언제든 해지할 수 있어요.'}
            </p>
            {user.email ? (
              <p className="text-xs text-ink-muted/80 mb-5 break-all">
                {isEn ? `Signed in as ${user.email}` : `${user.email} 계정으로 로그인돼 있어요`}
              </p>
            ) : null}

            {/* 이미 Pro인 사람에게 QR과 요금제를 보이면 안 된다 — 이미 산 것을 또 권하는 꼴이다 */}
            {tier !== 'pro' ? (
              <>
                <div className="bg-surface-white border border-surface-amber rounded-xl px-4 py-4 mb-5 text-left flex items-center gap-4">
                  <img
                    src={appQr}
                    alt={isEn ? 'QR code to the Chaerok app page' : '채록 앱 안내 QR 코드'}
                    className="w-24 h-24 rounded-lg border border-surface-amber/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-1">
                      {subscribedBefore
                        ? isEn
                          ? 'Resubscribe in the Chaerok app'
                          : '구독은 채록 앱에서 다시 시작해요'
                        : isEn
                          ? 'Start free in the Chaerok app'
                          : '무료 체험은 채록 앱에서 시작해요'}
                    </p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {subscribedBefore
                        ? isEn
                          ? 'Open the Chaerok app and resubscribe in Settings → Chaerok Pro. Come back here with the same account.'
                          : '채록 앱을 열고 설정 → 채록 Pro에서 다시 시작하세요. 같은 계정으로 다시 오면 바로 담을 수 있어요.'
                        : isEn
                          ? 'Scan with your phone camera to get the app, then start the 2-week free trial in Settings → Chaerok Pro. Come back here with the same account.'
                          : '휴대폰 카메라로 QR을 찍어 앱을 받고, 설정 → 채록 Pro에서 2주 무료 체험을 시작하세요. 같은 계정으로 다시 오면 바로 담을 수 있어요.'}
                    </p>
                  </div>
                </div>

                <a href="/#pricing" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full mb-2.5">
                    {isEn ? 'See plans' : '요금제 보기'}
                  </Button>
                </a>
              </>
            ) : null}
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
