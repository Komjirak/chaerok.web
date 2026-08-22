import { motion } from 'motion/react';
import { AgentPulse } from '../ui/AgentPulse';
import { Send, PenLine, Sunrise } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 작동 방식 — 피치덱 02P의 3스텝을 그대로 받는다.
 *
 * 예전 판은 "지능형 엔진·온톨로지 기반 그래프 UI" 같은 내부 언어로 기능을
 * 나열했다. 이 절의 일은 기능 소개가 아니라 "던지기만 해도 되는 이유"를
 * 납득시키는 것 — 그래서 순서가 곧 내용인 3스텝이고, 번호가 정보를 싣는다.
 */
export function Features() {
  const { t } = useTranslation();

  const steps = [
    { icon: Send, step: t('features.s1.step'), title: t('features.s1.title'), desc: t('features.s1.desc') },
    { icon: PenLine, step: t('features.s2.step'), title: t('features.s2.title'), desc: t('features.s2.desc') },
    { icon: Sunrise, step: t('features.s3.step'), title: t('features.s3.title'), desc: t('features.s3.desc') },
  ];

  return (
    <section id="features" className="py-16 md:py-20 bg-surface-paper">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-amber/50 text-chaerok-600 mb-6">
            <AgentPulse />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif mb-6">
            {t('features.title1')}<br className="md:hidden" /> {t('features.title2')}
          </h2>
          <p className="text-lg text-ink-muted leading-relaxed text-balance">
            {t('features.desc')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              className="rounded-2xl p-8 shadow-ambient border border-surface-amber/50 bg-white"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-chaerok-100 text-chaerok-600 flex items-center justify-center">
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-semibold tracking-[0.14em] text-chaerok-600">{item.step}</span>
              </div>
              <h3 className="text-xl font-serif font-medium mb-3">{item.title}</h3>
              <p className="text-ink-muted leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
