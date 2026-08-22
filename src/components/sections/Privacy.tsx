import { motion } from 'motion/react';
import { ShieldCheck, Lock, DoorOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 프라이버시 — 클릭 직전의 가장 큰 반대("내 기록이 잡히면?")를 지우는 절.
 *
 * 제목을 피치덱 03P의 "일기를 서버에 올리지 않는 메모 앱"으로 바꿨다 —
 * 예전 제목("오늘의 통찰이 내일의 지혜가…")은 프라이버시와 무관했다.
 * "여러 기기에서 이어보기"는 모든 입구 절로 옮기고, 그 자리에
 * "볼모 없는 구독"(해지해도 기록은 내 폰에)을 넣었다.
 */
export function Privacy() {
  const { t } = useTranslation();

  const items = [
    { icon: ShieldCheck, title: t('privacy.f1.title'), desc: t('privacy.f1.desc') },
    { icon: Lock, title: t('privacy.f2.title'), desc: t('privacy.f2.desc') },
    { icon: DoorOpen, title: t('privacy.f3.title'), desc: t('privacy.f3.desc') },
  ];

  return (
    <section className="py-16 md:py-20 bg-surface-paper">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="text-center lg:text-left">
            {/* 온톨로지 절과 같은 이유 — 조건절/귀결절을 데스크톱에서도 줄로 가른다 */}
            <h2 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
              {t('privacy.title1')}<br /> {t('privacy.title2')}
            </h2>
            <p className="text-lg text-ink-muted leading-relaxed mb-12">
              {t('privacy.desc')}
            </p>

            <div className="space-y-8">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex flex-col lg:flex-row items-center lg:items-start text-center lg:text-left gap-4 lg:gap-5"
                >
                  <div className="w-12 h-12 shrink-0 rounded-full bg-surface-amber/50 flex items-center justify-center text-ink-dark">
                    <item.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                    <p className="text-ink-muted leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            {/* Visual Phone Mockup */}
            <div className="w-[280px] h-[580px] bg-chaerok-600 rounded-[40px] shadow-ambient relative overflow-hidden border-8 border-white flex flex-col items-center justify-center text-white">
              <div className="absolute top-0 w-full h-12 bg-black/10"></div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <div className="font-serif text-2xl font-medium mb-2">{t('privacy.mock.title')}</div>
              <div className="text-white/80 text-sm text-center px-4">{t('privacy.mock.desc')}</div>

              <div className="absolute bottom-10 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white/50"></div>
                <div className="w-2 h-2 rounded-full bg-white/50"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
