import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { AgentPulse } from '../ui/AgentPulse';
import { Star, BookOpen, Cloud, Sparkles, Pencil, Calendar, ShoppingBag, StickyNote, FileText, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6794663892';
const PLAY_TESTING_URL = 'https://play.google.com/apps/testing/com.chaerok.komjirak';
/** 웹스토어 승인 완료(2026-08-05) — 소개 절로 스크롤하지 않고 바로 설치로 보낸다 */
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/pnndjhdcffpjmekjiknakoakablpocli';

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

export function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const storeButton = "gap-2 rounded-full px-5 border-surface-amber/60 bg-white text-ink-dark hover:bg-surface-amber/20 shadow-sm transition-all hover:-translate-y-0.5";

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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-amber/50 text-chaerok-800 text-sm font-medium mb-8">
              <AgentPulse />
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[56px] leading-[1.15] tracking-tight mb-6">
              {t('hero.title1')}<br />
              <span className="text-chaerok-600">{t('hero.title2')}</span>
            </h1>

            <p className="text-lg text-ink-muted leading-relaxed mb-10">
              {t('hero.desc')}
            </p>

            <div className="flex flex-col gap-3 items-center lg:items-start">
              <p className="text-sm font-medium text-ink-muted/80">{t('hero.platformLabel') || "Available on"}</p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Button onClick={() => window.open(APP_STORE_URL, '_blank', 'noopener')} variant="outline" size="sm" className={storeButton}>
                  <span className="font-semibold">App Store</span>
                  <span className="text-[10px] font-normal text-ink-muted">{t('hero.iosNote')}</span>
                </Button>
                <Button onClick={() => window.open(PLAY_TESTING_URL, '_blank', 'noopener')} variant="outline" size="sm" className={storeButton}>
                  <span className="font-semibold">Google Play</span>
                  <span className="text-[10px] font-normal text-ink-muted">{t('hero.androidNote')}</span>
                </Button>
                <Button onClick={() => navigate('/notes')} variant="outline" size="sm" className={storeButton}>
                  <span className="font-semibold">Web App</span>
                </Button>
                <Button onClick={() => window.open(CHROME_STORE_URL, '_blank', 'noopener')} variant="outline" size="sm" className={storeButton}>
                  <span className="font-semibold">Chrome Extension</span>
                  <span className="text-[10px] font-normal text-ink-muted">{t('hero.chromeNote')}</span>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <PromoVideo />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
