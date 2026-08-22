import { motion } from 'motion/react';
import { Check, MonitorSmartphone, Puzzle, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useExtension } from '@/hooks/useExtension';
import { CHROME_STORE_URL } from '@/lib/storeLinks';
import { trackEvent } from '@/lib/track';
import { useDevice, openAppStore } from '@/lib/appDownload';

/**
 * 모든 입구 — 앱을 중심에 둔 3타일(앱 / 크롬 익스텐션 / 웹 생각 노트).
 *
 * 예전 판은 익스텐션 단독 대공세가 페이지 세 번째 자리를 차지해 데스크톱
 * 방문자를 앱이 아닌 익스텐션으로 분산시켰다. 익스텐션은 리텐션 부스터지
 * 획득 도구가 아니라, 요금제 뒤로 내리고 생태계 절로 눌러 담는다.
 * #extension 앵커는 유지(웹스토어 심사·외부 링크가 이 주소를 안다).
 */
export function Extension() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const device = useDevice();
  const { installed } = useExtension();

  return (
    <section id="extension" className="py-16 md:py-20 bg-surface-amber/30">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
            {t('extension.title1')}<br className="md:hidden" /> {t('extension.title2')}
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed">
            {t('extension.desc')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* 앱 — 중심 타일. 채워진 버튼은 이 절에서 이것 하나 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-white border-2 border-chaerok-600 shadow-ambient p-7 flex flex-col"
          >
            <div className="w-11 h-11 rounded-xl bg-chaerok-100 text-chaerok-600 flex items-center justify-center mb-5">
              <Smartphone className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium text-lg mb-2">{t('extension.app.title')}</h3>
            <p className="text-sm text-ink-muted leading-relaxed mb-6 flex-1">{t('extension.app.desc')}</p>
            <Button className="w-full" onClick={() => openAppStore('dl_everywhere', device)}>
              {t('extension.app.cta')}
            </Button>
          </motion.div>

          {/* 크롬 익스텐션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl bg-surface-paper border border-surface-amber p-7 flex flex-col"
          >
            <div className="w-11 h-11 rounded-xl bg-chaerok-100 text-chaerok-600 flex items-center justify-center mb-5">
              <Puzzle className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium text-lg mb-2">{t('extension.ext.title')}</h3>
            <p className="text-sm text-ink-muted leading-relaxed mb-6 flex-1">{t('extension.ext.desc')}</p>
            {installed ? (
              <div className="inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-white text-chaerok-800 font-medium text-sm">
                <Check className="w-4 h-4" strokeWidth={2} />
                {t('extension.ext.installed')}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { trackEvent('go_ext'); window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer'); }}
              >
                {t('extension.ext.cta')}
              </Button>
            )}
          </motion.div>

          {/* 웹 생각 노트 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl bg-surface-paper border border-surface-amber p-7 flex flex-col"
          >
            <div className="w-11 h-11 rounded-xl bg-chaerok-100 text-chaerok-600 flex items-center justify-center mb-5">
              <MonitorSmartphone className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium text-lg mb-2">{t('extension.web.title')}</h3>
            <p className="text-sm text-ink-muted leading-relaxed mb-6 flex-1">{t('extension.web.desc')}</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { trackEvent('go_webapp'); navigate('/notes'); }}
            >
              {t('extension.web.cta')}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
