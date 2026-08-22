import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { useDevice, openAppStore } from '@/lib/appDownload';

/**
 * 요금제 — 가격 앵커("하루 163원", 피치덱 05P)와 스토어 CTA.
 *
 * 예전 판의 결정적 문제: Free·Pro 카드의 버튼이 둘 다 /notes(읽기 전용 웹
 * 뷰어)로 갔다. 무료 기능은 전부 앱 안에 있고 결제도 앱 안에서만 되므로,
 * 두 버튼 다 방문 기기의 스토어로 보낸다(dl_pricing_free / dl_pricing_pro).
 */
export function Pricing() {
  const { t } = useTranslation();
  const device = useDevice();

  const freeFeatures = t('pricing.free.features', { returnObjects: true }) as string[];
  const proFeatures = t('pricing.pro.features', { returnObjects: true }) as string[];

  return (
    <section id="pricing" className="py-16 md:py-20 bg-white">
      <div className="max-w-[1000px] mx-auto px-5 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block text-sm font-medium text-chaerok-600 bg-chaerok-100 rounded-full px-4 py-1 mb-6">
            {t('pricing.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl font-serif mb-6">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed text-balance">
            {t('pricing.desc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            className="rounded-2xl p-8 border border-surface-amber/50 bg-surface-paper flex flex-col transition-shadow hover:shadow-lg"
          >
            <h3 className="text-xl font-serif font-medium mb-1">{t('pricing.free.name')}</h3>
            <p className="text-sm text-ink-muted mb-6">{t('pricing.free.desc')}</p>
            <div className="mb-8">
              <span className="text-4xl font-serif font-medium">{t('pricing.free.price')}</span>
              <span className="text-ink-muted ml-1">{t('pricing.free.period')}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-ink-dark">
                  <Check className="w-5 h-5 text-chaerok-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => openAppStore('dl_pricing_free', device)}>
              {t('pricing.free.cta')}
            </Button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 300 }}
            className="rounded-2xl p-8 border-2 border-chaerok-600 bg-white shadow-ambient relative flex flex-col transition-shadow hover:shadow-xl hover:shadow-chaerok-600/10"
          >
            <div className="absolute -top-3 left-8 text-xs font-semibold text-white bg-chaerok-600 rounded-full px-3 py-1">
              {t('pricing.pro.badge')}
            </div>
            <h3 className="text-xl font-serif font-medium mb-1">{t('pricing.pro.name')}</h3>
            <p className="text-sm text-ink-muted mb-2">{t('pricing.pro.desc')}</p>
            <div className="inline-block text-xs font-medium text-chaerok-800 bg-surface-amber/30 rounded-md px-2 py-1 mb-6 self-start">
              {t('pricing.pro.support')}
            </div>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-serif font-medium">{t('pricing.pro.price')}</span>
              <span className="text-ink-muted">{t('pricing.pro.period')}</span>
              {/* 가격 앵커 — 월 4,900원을 하루 단위로 되읽어 준다 */}
              <span className="text-sm text-chaerok-600 font-medium">{t('pricing.pro.perDay')}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-ink-dark">
                  <Check className="w-5 h-5 text-chaerok-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => openAppStore('dl_pricing_pro', device)}>
              {t('pricing.pro.cta')}
            </Button>
          </motion.div>
        </div>

        <p className="text-center text-sm text-ink-muted mt-8">
          {t('pricing.footnote')}
        </p>
      </div>
    </section>
  );
}
