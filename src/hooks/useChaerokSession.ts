import { useEffect, useState } from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, type Tier } from '@/lib/chaerok';

/**
 * 로그인 상태와 등급을 함께 들고 있는다.
 *
 * 등급은 `users/{uid}.tier`에서 읽는다 — 결제 웹훅과 운영자 부여가 모두 그 문서를
 * 쓰므로, 앱과 웹이 같은 값을 본다. 클라이언트가 이 값을 고쳐도 서버가 믿지
 * 않으므로(Firestore 규칙과 Cloud Functions가 각자 확인한다) 화면 표시용이다.
 */
export interface ChaerokSession {
  user: User | null;
  tier: Tier;
  /** 처음 인증 상태를 확인하기 전 — 로그인 화면을 깜빡이지 않게 한다 */
  loading: boolean;
  signIn: () => Promise<void>;
  signOutNow: () => Promise<void>;
  /** 로그인 실패 사유 (사용자에게 보여줄 문구) */
  error: string | null;
}

export function useChaerokSession(isEn: boolean): ChaerokSession {
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState<Tier>('free');
  const [authLoading, setAuthLoading] = useState(true);
  // 등급은 로그인 확인 뒤 Firestore에서 따로 읽는다. 이 조회가 끝나기 전에
  // 화면을 그리면 기본값 'free'가 잠깐 보인다 — Pro 사용자에게 무료 안내
  // 화면이 깜빡이는 원인이라, 조회 중에는 loading으로 묶는다.
  const [tierPending, setTierPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) setTierPending(true);
      if (!settled) {
        settled = true;
        setAuthLoading(false);
      }
      if (!u) {
        setTier('free');
        return;
      }
      try {
        const snap = await getDoc(doc(db(), 'users', u.uid));
        const raw = snap.exists() ? snap.get('tier') : null;
        // 'mind'는 등급 이름을 'pro'로 바꾸기 전에 부여된 계정 — 받아준다 (앱 remoteTier.ts와 같은 규칙)
        setTier(raw === 'pro' || raw === 'mind' ? 'pro' : 'free');
      } catch {
        setTier('free');
      } finally {
        setTierPending(false);
      }
    });

    const resolveRedirect = async () => {
      try {
        await getRedirectResult(auth());
      } catch {
        // ignore redirect errors and let auth state settle naturally
      } finally {
        if (!settled) {
          settled = true;
          setAuthLoading(false);
        }
      }
    };

    void resolveRedirect();

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    // 어디서나 팝업이 기본이다. 리다이렉트는 authDomain(firebaseapp.com)이
    // 다른 출처라 복귀 세션이 서드파티 저장소에 남아야 하는데, 요즘 브라우저는
    // 그걸 막는다 — 데스크톱 익스텐션 창(08-11)에 이어 모바일 Safari/Chrome
    // 에서도(08-13) "로그인 → 다시 로그인 화면" 루프로 실증됐다. 팝업은 창끼리
    // postMessage로 끝나 저장소 분리와 무관하다. 리다이렉트는 팝업이 차단된
    // 경우의 마지막 폴백으로만 남긴다.
    try {
      await signInWithPopup(auth(), provider);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      if (code === 'auth/unauthorized-domain') {
        setError(
          isEn
            ? 'This domain is not authorized for Google Sign-In. Please add it to Firebase Console.'
            : '이 도메인이 Firebase 승인된 도메인 목록에 없습니다. Firebase Console에서 도메인을 추가해 주세요.',
        );
        return;
      }

      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth(), provider);
          return;
        } catch {
          // redirect flow also failed, so show a friendly message below
        }
      }

      setError(
        code === 'auth/popup-blocked'
          ? isEn
            ? 'Your browser blocked the popup. Please try again or continue in the same tab.'
            : '브라우저가 팝업을 막았어요. 같은 탭에서 다시 시도해 주세요.'
          : isEn
            ? "Couldn't sign in. Please try again in a moment."
            : '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
      );
    }
  };

  const signOutNow = async () => {
    await signOut(auth());
  };

  // 로그인 확인 중이거나, 로그인된 사용자의 등급 조회가 아직이면 로딩으로 취급
  const loading = authLoading || (user !== null && tierPending);

  return { user, tier, loading, signIn, signOutNow, error };
}
