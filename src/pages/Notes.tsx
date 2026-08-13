import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  AlertTriangle,
  Check,
  CloudOff,
  Copy,
  Folder,
  Languages,
  LogOut,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useChaerokSession } from '@/hooks/useChaerokSession';
import { auth, cleanUrlForDisplay, db, relativeDate, type RemoteNote } from '@/lib/chaerok';
import { buildNoteShareText, detectLang, translateNote } from '@/lib/noteActions';
import { trackEvent } from '@/lib/track';
import logoImg from '@/assets/logo.png';

/**
 * 웹 생각 노트 — 폰에서 담은 기록을 읽는다.
 *
 * **읽기 전용이다.** 편집·삭제를 웹에서 허용하면 기기와의 충돌 해소
 * (last-write-wins)와 삭제 툼스톤을 웹에서도 구현해야 한다. 이 화면의 목적은
 * "담은 게 어디서나 열린다"를 보여주는 것이고, 그 값은 읽기만으로 나온다.
 * 담기는 크롬 익스텐션이 맡는다.
 */

type Filter = { kind: 'all' } | { kind: 'folder' | 'tag'; value: string };

export function Notes() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const { user, tier, loading, signIn, signOutNow, error } = useChaerokSession(isEn);

  const [notes, setNotes] = useState<RemoteNote[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<RemoteNote | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotes(null);
      return;
    }
    const ref = query(
      collection(db(), 'notes', user.uid, 'items'),
      orderBy('updatedAt', 'desc'),
      limit(500),
    );
    return onSnapshot(
      ref,
      (snap) => {
        setNotes(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as RemoteNote)
            // 툼스톤은 "지웠다"는 표식이라 목록에 없어야 한다
            .filter((n) => !n.deleted),
        );
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [user]);

  const folders = useMemo(() => tally(notes, (n) => (n.folderName ? [n.folderName] : [])), [notes]);
  const tags = useMemo(
    () => tally(notes, (n) => (n.tags ?? []).map((t) => t.name)).slice(0, 12),
    [notes],
  );

  const rows = useMemo(() => {
    let out = notes ?? [];
    if (filter.kind === 'folder') out = out.filter((n) => n.folderName === filter.value);
    if (filter.kind === 'tag') {
      out = out.filter((n) => (n.tags ?? []).some((t) => t.name === filter.value));
    }
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter((n) =>
        [n.title, n.summary, n.memo ?? '', n.rawContent, (n.tags ?? []).map((t) => t.name).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      );
    }
    return out;
  }, [notes, filter, q]);

  // ── 로그인 전 ──
  if (loading) {
    return (
      <main className="flex-1 bg-surface-paper grid place-items-center px-5 py-24">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-surface-amber/60 animate-pulse" />
          <div className="mx-auto mb-3 h-8 w-40 rounded-full bg-surface-amber/40 animate-pulse" />
          <div className="mx-auto h-4 w-56 rounded-full bg-surface-amber/20 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 bg-surface-paper grid place-items-center px-5 py-24">
        <div className="max-w-sm text-center">
          <img src={logoImg} alt="" className="w-14 h-14 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-serif mb-3">{isEn ? 'Your Notes' : '생각 노트'}</h1>
          <p className="text-ink-muted mb-8 leading-relaxed">
            {isEn
              ? 'Pick up where you left off — the notes you captured on your mobile device, here.'
              : '모바일 채록에 담은 기록을 여기서 이어 보세요.'}
          </p>
          <Button className="w-full" onClick={signIn}>
            {isEn ? 'Sign in with Google' : 'Google로 로그인'}
          </Button>
          {error ? <p className="mt-4 text-sm text-chaerok-800">{error}</p> : null}
          <p className="mt-5 text-xs text-ink-muted leading-relaxed">
            {isEn
              ? 'Sign in only matters if you keep notes on your account. Use the same account as your mobile device.'
              : '로그인은 기록을 계정에 묶어둘 때만 필요해요. 모바일에서 쓰던 계정으로 로그인해 주세요.'}
          </p>
        </div>
      </main>
    );
  }

  // ── 로그인 후 ──
  return (
    <main className="flex-1 bg-surface-paper">
      {/* 도구 막대 */}
      <div className="sticky top-16 z-40 bg-surface-paper/90 backdrop-blur-md border-b border-surface-amber/40">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 h-14 flex items-center gap-3">
          <label className="flex-1 max-w-sm flex items-center gap-2 bg-surface-white border border-surface-amber rounded-full px-3.5 py-1.5">
            <Search className="w-4 h-4 text-ink-muted shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder={isEn ? 'Search notes' : '기록 검색'}
              aria-label={isEn ? 'Search notes' : '기록 검색'}
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-ink-muted"
            />
          </label>

          {/*
            어느 계정의 기록인지가 화면에 없어 "지금 뭘 보고 있는 거지"가 됐다
            (PO 08-11 — 등급 표류 사고를 짚는 동안 계정을 확인할 방법이 없었다).
            이메일이 등급 배지보다 먼저다: 배지는 계정의 속성이라, 주어 없이
            속성만 있으면 반쪽 정보다. 좁은 화면에서는 이메일을 줄이되
            title로 전체를 남긴다.
          */}
          <span
            className="ml-auto flex items-center gap-2 min-w-0"
            title={user?.email ?? undefined}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full shrink-0"
              />
            ) : null}
            <span className="text-xs text-ink-muted truncate max-w-[120px] sm:max-w-[220px]">
              {user?.email ?? user?.displayName ?? ''}
            </span>
          </span>

          <span
            className={
              tier === 'pro'
                ? 'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-surface-amber text-chaerok-800'
                : 'shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-surface-white border border-surface-amber text-ink-muted'
            }
          >
            {tier === 'pro' ? (isEn ? 'Pro plan' : 'Pro 요금제 사용중') : isEn ? 'Free' : '무료'}
          </span>

          <button
            onClick={signOutNow}
            title={isEn ? 'Sign out' : '로그아웃'}
            className="p-2 rounded-lg text-ink-muted hover:text-chaerok-600 hover:bg-surface-amber/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* 분류 */}
        <nav className="hidden lg:block" aria-label={isEn ? 'Filters' : '분류'}>
          <SideLabel>{isEn ? 'Folders' : '폴더'}</SideLabel>
          <FilterBtn
            active={filter.kind === 'all'}
            count={notes?.length ?? 0}
            onClick={() => setFilter({ kind: 'all' })}
          >
            {isEn ? 'All notes' : '모든 기록'}
          </FilterBtn>
          {folders.map(([name, n]) => (
            <FilterBtn
              key={name}
              active={filter.kind === 'folder' && filter.value === name}
              count={n}
              onClick={() => setFilter({ kind: 'folder', value: name })}
            >
              {name}
            </FilterBtn>
          ))}

          {tags.length > 0 ? (
            <>
              <SideLabel className="mt-7">{isEn ? 'Tags' : '자주 쓰는 태그'}</SideLabel>
              {tags.map(([name, n]) => (
                <FilterBtn
                  key={name}
                  active={filter.kind === 'tag' && filter.value === name}
                  count={n}
                  onClick={() => setFilter({ kind: 'tag', value: name })}
                >
                  {name}
                </FilterBtn>
              ))}
            </>
          ) : null}
        </nav>

        {/* 목록 */}
        <section>
          <header className="flex items-baseline gap-2.5 mb-4">
            <h1 className="text-2xl font-serif">
              {filter.kind === 'all'
                ? isEn
                  ? 'All notes'
                  : '모든 기록'
                : filter.kind === 'folder'
                  ? filter.value
                  : `#${filter.value}`}
            </h1>
            {rows.length > 0 ? (
              <span className="text-sm text-ink-muted tabular-nums">
                {isEn ? `${rows.length} notes` : `${rows.length}개`}
              </span>
            ) : null}
          </header>

          {notes === null ? (
            <div className="grid gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-surface-amber/40 animate-pulse" />
              ))}
            </div>
          ) : failed ? (
            <Empty
              icon={<AlertTriangle className="w-5 h-5" />}
              title={isEn ? "Couldn't load your notes" : '기록을 불러오지 못했어요'}
              body={isEn ? 'Check your connection and refresh.' : '연결을 확인하고 새로 고쳐 주세요.'}
            />
          ) : rows.length > 0 ? (
            <div className="grid gap-2.5">
              {rows.map((n) => (
                <NoteCard key={n.id} note={n} isEn={isEn} onOpen={() => setOpen(n)} />
              ))}
            </div>
          ) : q.trim() || filter.kind !== 'all' ? (
            <Empty
              icon={<Search className="w-5 h-5" />}
              title={isEn ? 'Nothing matched' : '찾는 기록이 없어요'}
              body={isEn ? 'Try another word, or browse by folder.' : '다른 낱말로 찾아보시거나, 폴더에서 훑어보세요.'}
            />
          ) : tier === 'pro' ? (
            <Empty
              icon={<CloudOff className="w-5 h-5" />}
              title={isEn ? 'Nothing here yet' : '아직 올라온 기록이 없어요'}
              body={
                isEn
                  ? 'On your mobile device, check Settings → Organizing → Process in the cloud. Once it is on, your notes appear here.'
                  : '모바일 채록에서 설정 → 정리하는 곳 → "클라우드에서 처리"가 켜져 있는지 확인해 주세요. 켜져 있으면 잠시 뒤 올라와요.'
              }
            />
          ) : (
            <Empty
              icon={<Sparkles className="w-5 h-5" />}
              title={isEn ? 'Nothing here yet' : '아직 올라온 기록이 없어요'}
              body={
                isEn
                  ? 'Keeping notes on your account is part of Chaerok Pro. Turn on cloud processing on your mobile device and they show up here.'
                  : '기록을 계정에 보관하는 건 채록 Pro의 기능이에요. 모바일에서 클라우드 처리를 켜면 여기에 나타나요.'
              }
              action={
                <Link to="/#pricing">
                  <Button variant="outline" size="sm">
                    {isEn ? 'See plans' : '요금제 보기'}
                  </Button>
                </Link>
              }
            />
          )}
        </section>
      </div>

      {open ? <Detail note={open} isEn={isEn} onClose={() => setOpen(null)} /> : null}
    </main>
  );
}

// ── 조각들 ────────────────────────────────────────────────

function tally(
  notes: RemoteNote[] | null,
  pick: (n: RemoteNote) => string[],
): [string, number][] {
  const m = new Map<string, number>();
  for (const n of notes ?? []) for (const k of pick(n)) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function SideLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2 ml-2 ${className}`}
    >
      {children}
    </h2>
  );
}

function FilterBtn({
  children,
  count,
  active,
  onClick,
}: {
  children: ReactNode;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-2 text-sm text-left px-2.5 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-surface-amber text-chaerok-800 font-medium'
          : 'text-ink-muted hover:bg-surface-amber/50 hover:text-ink-dark'
      }`}
    >
      <span className="truncate">{children}</span>
      <span className="ml-auto text-xs tabular-nums opacity-70">{count}</span>
    </button>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-amber/70 text-chaerok-800 border border-surface-amber">
      {children}
    </span>
  );
}

function NoteCard({
  note,
  isEn,
  onOpen,
}: {
  note: RemoteNote;
  isEn: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-surface-white border border-surface-amber/70 rounded-xl px-4 py-4 hover:border-chaerok-400 transition-colors"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg leading-snug mb-1">
            {note.title || (isEn ? 'Untitled' : '제목 없음')}
          </h3>
          {note.summary ? (
            <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">{note.summary}</p>
          ) : null}
        </div>
        {/* Pro 이미지 동기화 — 폰에서 올린 최적화본 썸네일 */}
        {note.imageUrl ? (
          <img
            src={note.imageUrl}
            alt=""
            loading="lazy"
            className="w-16 h-16 shrink-0 rounded-lg object-cover border border-surface-amber/70"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-ink-muted">
        <span>{relativeDate(note.updatedAt, isEn)}</span>
        {note.folderName ? (
          <>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {note.folderName}
            </span>
          </>
        ) : null}
        {(note.tags ?? []).slice(0, 3).map((t) => (
          <Chip key={t.name}>{t.name}</Chip>
        ))}
      </div>
    </button>
  );
}

function Detail({
  note,
  isEn,
  onClose,
}: {
  note: RemoteNote;
  isEn: boolean;
  onClose: () => void;
}) {
  /*
    원문 번역·복사·공유 (앱 1.0.1 검토 2·4장 — 웹 우선 도입, PO 결정 08-13).
    번역 결과는 화면 상태로만 든다 — 저장하면 스키마·동기화 표면이 늘어난다.
    수요는 note_translate/note_share 이벤트로 본다.
  */
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'original' | 'translation' | 'share' | null>(null);

  // 사이트 언어가 곧 번역 목표다 — 웹에는 앱의 '기본 기록 언어' 설정이 없다
  const siteLang = isEn ? ('en' as const) : ('ko' as const);
  const rawLang = detectLang(note.rawContent ?? '');
  const canTranslate = rawLang !== 'unknown' && rawLang !== siteLang;

  const copy = async (key: 'original' | 'translation' | 'share', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // 클립보드 권한 거부 — 조용히 넘긴다 (버튼 라벨이 안 바뀌는 것이 곧 피드백)
    }
  };

  const runTranslate = async () => {
    if (translating) return;
    const user = auth().currentUser;
    if (!user) return;
    setTranslating(true);
    setTranslateError(null);
    const result = await translateNote(note.rawContent, siteLang, await user.getIdToken());
    setTranslating(false);
    if (result.text) {
      setTranslation(result.text);
      trackEvent('note_translate');
    } else {
      setTranslateError(
        result.message ??
          (isEn
            ? "Couldn't translate right now. Try again in a moment."
            : '지금은 번역하지 못했어요. 잠시 뒤 다시 시도해 주세요.'),
      );
    }
  };

  /*
    공유 — 모바일 브라우저는 시스템 공유 시트(navigator.share), 데스크톱은
    클립보드 복사로 대신한다(공유 API가 없는 환경이 아직 많다). 본문 조립은
    앱과 같은 규칙(noteActions.buildNoteShareText)이라 어느 쪽에서 공유해도
    같은 글이 나간다.
  */
  const share = async () => {
    const text = buildNoteShareText(note, isEn);
    trackEvent('note_share');
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // 사용자가 시트를 닫은 것 — 복사 폴백으로 넘어가지 않는다
        return;
      }
    }
    await copy('share', text);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-dark/35" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[560px] bg-surface-paper border-l border-surface-amber overflow-y-auto">
        <div className="px-6 py-6 pb-24">
          <div className="float-right flex items-center gap-1">
            {/* 공유 — 채록하기의 반대 방향. 데스크톱은 본문 복사로 동작한다 */}
            <button
              onClick={() => void share()}
              title={
                copied === 'share'
                  ? isEn
                    ? 'Copied'
                    : '복사했어요'
                  : isEn
                    ? 'Share this note'
                    : '기록 공유하기'
              }
              aria-label={isEn ? 'Share this note' : '기록 공유하기'}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-dark hover:bg-surface-amber/60 transition-colors"
            >
              {copied === 'share' ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              aria-label={isEn ? 'Close' : '닫기'}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-dark hover:bg-surface-amber/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="font-serif text-2xl leading-snug pr-10 mb-2">
            {note.title || (isEn ? 'Untitled' : '제목 없음')}
          </h2>
          <p className="text-xs text-ink-muted mb-8">
            {new Date(note.createdAt || note.updatedAt).toLocaleString(isEn ? 'en-US' : 'ko-KR')}
            {'  ·  '}
            {note.processedByLayer === 'L1'
              ? isEn
                ? 'Organized on device'
                : '기기에서 정리함'
              : isEn
                ? 'Organized in the cloud'
                : '클라우드에서 정리함'}
          </p>

          {note.imageUrl ? (
            <Block label={isEn ? 'Image' : '이미지'}>
              {/* 새 탭 = 크게 보기 (웹 뷰어는 읽기 전용이라 확대 UI를 따로 만들지 않는다) */}
              <a href={note.imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={note.imageUrl}
                  alt={note.title || ''}
                  loading="lazy"
                  className="w-full max-h-96 object-contain rounded-xl border border-surface-amber/70 bg-surface-amber/20"
                />
              </a>
            </Block>
          ) : null}

          {/* 사용자가 담기 창에서 적은 한 줄 — 있을 때만. AI 요약과 섞지 않는다 */}
          {note.memo?.trim() ? (
            <Block label={isEn ? 'Memo' : '메모'}>
              <p className="whitespace-pre-wrap leading-relaxed">{note.memo}</p>
            </Block>
          ) : null}

          {note.summary ? (
            <Block label={isEn ? 'Summary' : 'AI 요약'}>
              <p className="whitespace-pre-wrap leading-relaxed">{note.summary}</p>
            </Block>
          ) : null}

          {(note.tags ?? []).length > 0 ? (
            <Block label={isEn ? 'Tags' : '태그'}>
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((t) => (
                  <Chip key={t.name}>{t.name}</Chip>
                ))}
              </div>
            </Block>
          ) : null}

          {note.sourceUrl ? (
            <Block label={isEn ? 'Source' : '출처'}>
              <a
                href={note.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-node-blue underline break-all"
              >
                {cleanUrlForDisplay(note.sourceUrl)}
              </a>
            </Block>
          ) : null}

          {/* 메모와 같은 내용이면 두 번 보여줄 이유가 없다 (앱 note/[id].tsx와 같은 규칙) */}
          {note.rawContent && note.rawContent.trim() !== (note.memo ?? '').trim() ? (
            <Block label={isEn ? 'Original' : '원본'}>
              <p className="text-sm text-ink-muted whitespace-pre-wrap bg-surface-amber/30 rounded-xl px-4 py-3.5 max-h-80 overflow-y-auto leading-relaxed">
                {note.rawContent}
              </p>

              {/* 원문 아래 행동 두 개 — 요약은 사이트 언어인데 원문이 다른 언어로
                  남는 지점에서 바로 쓸 것: 옮겨 붙이기(복사)와 전체 번역 */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {canTranslate && !translation ? (
                  <button
                    onClick={() => void runTranslate()}
                    disabled={translating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-surface-amber text-chaerok-800 hover:border-chaerok-400 transition-colors disabled:opacity-60"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    {translating
                      ? isEn
                        ? 'Translating…'
                        : '번역하고 있어요…'
                      : isEn
                        ? 'Translate'
                        : '번역하기'}
                  </button>
                ) : null}
                <button
                  onClick={() => void copy('original', note.rawContent)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-surface-amber text-ink-muted hover:border-chaerok-400 transition-colors"
                >
                  {copied === 'original' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied === 'original' ? (isEn ? 'Copied' : '복사했어요') : isEn ? 'Copy' : '복사하기'}
                </button>
              </div>

              {translateError ? (
                <p className="mt-2 text-xs text-chaerok-800">{translateError}</p>
              ) : null}

              {translation ? (
                <div className="mt-3 bg-surface-white border border-surface-amber/70 rounded-xl px-4 py-3.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    {isEn ? 'Translation' : '번역'}
                  </h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {translation}
                  </p>
                  <button
                    onClick={() => void copy('translation', translation)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-surface-amber text-ink-muted hover:border-chaerok-400 transition-colors"
                  >
                    {copied === 'translation' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied === 'translation'
                      ? isEn
                        ? 'Copied'
                        : '복사했어요'
                      : isEn
                        ? 'Copy'
                        : '복사하기'}
                  </button>
                </div>
              ) : null}
            </Block>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-2">
        {label}
      </h3>
      {children}
    </section>
  );
}

function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-20">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-surface-amber/60 grid place-items-center text-ink-muted">
        {icon}
      </div>
      <h2 className="text-lg font-serif mb-2">{title}</h2>
      <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed mb-5">{body}</p>
      {action}
    </div>
  );
}
