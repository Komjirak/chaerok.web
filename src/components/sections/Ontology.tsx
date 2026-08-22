import { motion } from 'motion/react';
import { Sunrise, BookOpenText, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 먼저 말 거는 뇌 — 브리핑·주간 리포트·재발견.
 *
 * 예전 판은 "시맨틱 온톨로지·클러스터링 알고리즘"을 추상 그래프로 보여줬다.
 * 방문자에게 의미 있는 것은 용어가 아니라 받는 경험이라, 시각물을 채록이의
 * 아침 브리핑 목업으로 바꿨다 — 다크 섹션(페이지 리듬)과 #ontology 앵커는
 * 그대로 둔다(헤더 내비·외부 링크 보호).
 */
export function Ontology() {
  const { t } = useTranslation();

  const items = [
    { icon: Sunrise, title: t('ontology.l1.title'), desc: t('ontology.l1.desc') },
    { icon: BookOpenText, title: t('ontology.l2.title'), desc: t('ontology.l2.desc') },
    { icon: RotateCcw, title: t('ontology.l3.title'), desc: t('ontology.l3.desc') },
  ];

  return (
    <section id="ontology" className="py-16 md:py-20 bg-[#362f29] text-surface-paper relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* 브리핑 목업 — 앱의 홈 화면에서 채록이가 실제로 하는 말의 모양 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 flex justify-center"
          >
            <div className="w-full max-w-[400px] rounded-3xl bg-surface-paper/5 border border-surface-paper/15 p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-surface-amber/90">
                <span className="inline-block px-2.5 py-1 rounded-full bg-surface-amber/15">{t('ontology.mock.chip1')}</span>
                <span className="inline-block px-2.5 py-1 rounded-full bg-surface-amber/15">{t('ontology.mock.chip2')}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-chaerok-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={2} aria-hidden />
                </div>
                <div className="space-y-3">
                  <p className="rounded-2xl rounded-tl-md bg-surface-paper/10 px-4 py-3 text-sm leading-relaxed text-surface-paper/95">
                    {t('ontology.mock.greeting')}
                  </p>
                  <p className="rounded-2xl rounded-tl-md bg-surface-paper/10 px-4 py-3 text-sm leading-relaxed text-surface-paper/95">
                    {t('ontology.mock.link')}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-surface-paper/10 border border-surface-paper/10 px-4 py-3">
                <p className="text-xs text-surface-paper/60 mb-1">{t('ontology.mock.noteLabel')}</p>
                <p className="text-sm font-medium text-surface-paper/90">{t('ontology.mock.noteTitle')}</p>
              </div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 text-center lg:text-left">
            {/* 두 줄이 하나의 대구(창고↔뇌)라 데스크톱에서도 항상 줄을 가른다 (PO 지시) */}
            <h2 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
              {t('ontology.title1')}<br /> {t('ontology.title2')}
            </h2>
            <p className="text-lg text-surface-paper/70 leading-relaxed mb-10 text-balance">
              {t('ontology.desc')}
            </p>

            <div className="space-y-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col lg:flex-row items-center lg:items-start gap-3 lg:gap-4 justify-center lg:justify-start text-center lg:text-left">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-surface-paper/10 flex items-center justify-center text-surface-paper">
                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="font-medium text-surface-paper/95 mb-1">{item.title}</div>
                    <div className="text-sm text-surface-paper/60 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
