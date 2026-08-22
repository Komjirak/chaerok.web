import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { AgentPulse } from '../ui/AgentPulse';
import {
  Star, BookOpen, Cloud, Sparkles, Pencil, Calendar, ShoppingBag, StickyNote,
  FileText, Bookmark, Zap, ShieldCheck, Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CHROME_STORE_URL } from '@/lib/storeLinks';
import { trackEvent } from '@/lib/track';
import { Device, useDevice, openAppStore } from '@/lib/appDownload';

function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[10%] text-chaerok-400/40">
        <Star className="w-12 h-12 fill-current" />
      </motion.div>
      <motion.div animate={{ y: [0, 30, 0], x: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[80%] left-[5%] text-surface-amber/80">
        <Cloud className="w-16 h-16 fill-current" />
      </motion.div>
      <motion.div animate={{ y: [0, -15, 0], rotate: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[15%] right-[10%] text-chaerok-600/30">
        <BookOpen className="w-10 h-10" strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[15%] text-surface-amber/60">
        <Sparkles className="w-14 h-14" strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-[20%] left-[45%] text-chaerok-100/50 hidden md:block">
        <Pencil className="w-10 h-10 fill-current" />
      </motion.div>
      <motion.div animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="absolute bottom-[20%] left-[30%] text-chaerok-600/20">
        <Calendar className="w-8 h-8" strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, -25, 0], x: [0, 10, 0], rotate: [0, 15, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }} className="absolute top-[10%] left-[70%] text-surface-amber/70 hidden lg:block">
        <ShoppingBag className="w-12 h-12 fill-current" />
      </motion.div>
      <motion.div animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute top-[40%] right-[5%] text-chaerok-400/30">
        <StickyNote className="w-10 h-10" strokeWidth={1.5} />
      </motion.div>
      <motion.div animate={{ y: [0, -15, 0], rotate: [0, 8, 0] }} transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="absolute bottom-[15%] left-[55%] text-chaerok-100/60 hidden md:block">
        <FileText className="w-10 h-10 fill-current" />
      </motion.div>
      <motion.div animate={{ y: [0, 10, 0], rotate: [0, -15, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }} className="absolute top-[60%] right-[8%] text-surface-amber/50">
        <Bookmark className="w-8 h-8" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

/**
 * 히어로 영상 — 실제 앱 화면으로 만든 소개 영상 (무음 자동재생 루프).
 *
 * 예전에는 코드로 그린 목업 애니메이션이 이 자리에 있었는데, 스토어 패널
 * 기반 영상이 생기면서 교체했다(08-12). 화면·문구가 전부 실제 제품이라
 * 목업이 약속하고 제품이 못 지키는 어긋남이 원천적으로 없다.
 * 움직임 줄이기(prefers-reduced-motion) 설정에서는 포스터 한 장만 보여준다.
 * 언어별로 같은 구성의 영상이 따로 있다 — 영어 UI면 영어 패널 버전을 튼다.
 */
function PromoVideo() {
  const { t, i18n } = useTranslation();
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const en = i18n.language?.toLowerCase().startsWith('en');
  const videoSrc = en ? '/promo-hero-en.mp4' : '/promo-hero.mp4';
  const posterSrc = en ? '/promo-hero-en-poster.jpg' : '/promo-hero-poster.jpg';

  return (
    <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-ambient bg-[#8C3A1E]">
      {reduced ? (
        <img
          src={posterSrc}
          alt={t('hero.videoAlt', '채록 앱 소개 영상')}
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          // src만 바꾸면 재생 중인 영상이 갈리지 않는다 — key로 강제 재마운트
          key={videoSrc}
          className="h-full w-full object-cover"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={t('hero.videoAlt', '채록 앱 소개 영상')}
        />
      )}
    </div>
  );
}

/**
 * 모바일 스티키 CTA — 히어로를 지나 스크롤한 뒤에만 나타난다.
 * 기능·요금제를 읽고 마음이 선 자리에서 되돌아 올라가지 않게 하는 바닥 바.
 * 데스크톱(md 이상)에서는 렌더링만 하고 숨긴다 — QR 카드가 그 역할을 한다.
 */
function StickyStoreCta({ device }: { device: Device }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 560);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const store = device === 'android' ? 'Google Play' : 'App Store';

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-hidden={!show}
    >
      <div className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur border border-surface-amber shadow-ambient px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-dark truncate">{t('hero.stickyTitle')}</p>
          <p className="text-xs text-ink-muted truncate">{store}</p>
        </div>
        <Button
          size="sm"
          className="shrink-0 rounded-full px-5"
          onClick={() => openAppStore('dl_sticky', device)}
        >
          {t('hero.stickyCta')}
        </Button>
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const device = useDevice();

  const primaryLabel = device === 'android' ? t('hero.ctaAndroid') : t('hero.ctaIos');

  const chips = [
    { icon: Zap, label: t('hero.chip1') },
    { icon: ShieldCheck, label: t('hero.chip2') },
    { icon: Smartphone, label: t('hero.chip3') },
  ];

  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-24">
      <BackgroundElements />
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
          >
            {/* 출시 사실 + 2주 무료 — 지금 내세울 수 있는 유일하게 정직한 프루프 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-amber/50 text-chaerok-800 text-sm font-medium mb-8">
              <AgentPulse />
              {t('hero.badge')}
            </div>

            {/* 혜택 선행 — 은유("두 번째 뇌")는 본문 첫 문장으로 내렸다 */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] leading-[1.15] tracking-tight mb-6">
              {t('hero.title1')}<br />
              <span className="text-chaerok-600">{t('hero.title2')}</span>
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed mb-6 text-balance">
              {t('hero.desc')}
            </p>

            {/* 증거 칩 — 클릭 직전의 확신 요소 셋 */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
              {chips.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-surface-amber px-3 py-1.5 text-sm text-ink-dark">
                  <Icon className="w-4 h-4 text-chaerok-600" strokeWidth={2} aria-hidden />
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 items-center lg:items-start">
              {/* 화면당 프라이머리(채워진) 버튼은 이것 하나 — 디자인 시스템 5절 */}
              <Button
                size="lg"
                className="rounded-full px-10 shadow-ambient"
                onClick={() => openAppStore('dl_hero', device)}
              >
                {primaryLabel}
              </Button>

              {/* 리스크 리버설 — 클릭 직전 망설임을 지우는 자리 */}
              <p className="text-sm text-ink-muted">{t('hero.reassure')}</p>

              {/* 나머지 플랫폼은 강등 — 앱 다운로드가 이 화면의 유일한 주 행동 */}
              <p className="text-sm text-ink-muted/80 mt-2">
                {t('hero.othersLabel')}{' '}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-chaerok-600"
                  onClick={() => { trackEvent('go_webapp'); navigate('/notes'); }}
                >
                  {t('hero.otherWeb')}
                </button>
                {' · '}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-chaerok-600"
                  onClick={() => { trackEvent('go_ext'); window.open(CHROME_STORE_URL, '_blank', 'noopener'); }}
                >
                  {t('hero.otherExt')}
                </button>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative lg:h-[640px] flex flex-col items-center justify-center gap-5"
          >
            <div className="flex items-center gap-6">
              <PromoVideo />

              {/* QR 브리지 — 데스크톱 방문을 폰 설치로 잇는 유일한 다리 */}
              {device === 'desktop' && (
                <div className="hidden lg:flex flex-col items-center gap-3 rounded-2xl bg-white/90 border border-surface-amber shadow-ambient px-6 py-6 max-w-[180px]">
                  <img src="/qr-appstore.svg" alt={t('hero.qrTitle')} className="w-32 h-32" />
                  <p className="text-sm font-medium text-ink-dark text-center">{t('hero.qrTitle')}</p>
                  <p className="text-xs text-ink-muted text-center leading-relaxed">{t('hero.qrHint')}</p>
                </div>
              )}
            </div>

            {/* 영상이 보여주는 것을 채록이의 목소리로 한 번 더 */}
            <div className="flex items-start gap-2.5 max-w-[360px]">
              <div className="shrink-0 w-8 h-8 rounded-full bg-chaerok-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2} aria-hidden />
              </div>
              <p className="rounded-2xl rounded-tl-md bg-white/90 border border-surface-amber px-4 py-3 text-sm text-ink-dark leading-relaxed shadow-sm">
                {t('hero.agentBubble')}
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      <StickyStoreCta device={device} />
    </section>
  );
}
