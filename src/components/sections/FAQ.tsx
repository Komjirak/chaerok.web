import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { useDevice, openAppStore } from '@/lib/appDownload';

/**
 * FAQ + 마무리 CTA.
 *
 * 질문 3→5개 — 클릭 직전의 두 반대("해지하면 기록은?", "Android는 언제?")를
 * 추가했다. 마무리는 버튼 3개 동급 나열 대신 기기 인지 단일 CTA(dl_final)
 * + 데스크톱 QR — 히어로와 같은 문법으로 닫는다.
 */
export function FAQ() {
  const { t } = useTranslation();
  const device = useDevice();

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const ctaLabel = device === 'android' ? t('hero.ctaAndroid') : t('hero.ctaIos');

  return (
    <section id="faq" className="py-16 md:py-20 bg-surface-paper">
      <div className="max-w-[800px] mx-auto px-5 lg:px-10">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-16">
          {t('faq.title')}
        </h2>

        <div className="space-y-4 mb-24">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-surface-amber/50 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left font-medium text-lg hover:bg-surface-amber/10 transition-colors"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                {faq.q}
                <ChevronDown className={cn("w-5 h-5 text-ink-muted transition-transform duration-300", openIndex === idx && "rotate-180")} />
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-ink-muted leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* 마무리 — 피치덱 08P. 히어로와 같은 문법(단일 CTA + 안심 문구 + QR) */}
        <div className="text-center bg-white border border-surface-amber rounded-3xl p-12">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">{t('faq.cta.title')}</h2>
          <p className="text-ink-muted mb-8">{t('faq.cta.desc')}</p>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-10 shadow-ambient"
              onClick={() => openAppStore('dl_final', device)}
            >
              {ctaLabel}
            </Button>
            <p className="text-sm text-ink-muted">{t('hero.reassure')}</p>

            {device === 'desktop' && (
              <div className="mt-4 inline-flex items-center gap-4 rounded-2xl bg-surface-paper border border-surface-amber px-5 py-4 text-left">
                <img src="/qr-appstore.svg" alt={t('hero.qrTitle')} className="w-20 h-20" />
                <div>
                  <p className="text-sm font-medium text-ink-dark">{t('hero.qrTitle')}</p>
                  <p className="text-xs text-ink-muted">{t('hero.qrHint')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
