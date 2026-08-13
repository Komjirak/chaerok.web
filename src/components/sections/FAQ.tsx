import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Apple, Play, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_STORE_URL, PLAY_TESTING_URL } from '@/lib/storeLinks';

export function FAQ() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const faqs = [
    {
      q: t('faq.q1'),
      a: t('faq.a1')
    },
    {
      q: t('faq.q2'),
      a: t('faq.a2')
    },
    {
      q: t('faq.q3'),
      a: t('faq.a3')
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
        
        <div className="text-center bg-surface-paper border border-surface-amber rounded-3xl p-12">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">{t('faq.cta.title')}</h2>
          <p className="text-ink-muted mb-10">{t('faq.cta.desc')}</p>
          
          <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-4">
            <Button size="lg" className="bg-ink-dark hover:bg-ink-dark/80 px-4 sm:px-6 h-auto py-3 flex-col gap-1 text-white" onClick={() => window.open(APP_STORE_URL, '_blank', 'noopener')}>
              <Apple className="w-6 h-6 mb-1" />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] sm:text-xs text-white/80">{t('faq.cta.btnAppStorePrefix')}</span>
                <span className="text-sm font-semibold">{t('faq.cta.btnAppStoreAction')}</span>
              </div>
            </Button>
            <Button size="lg" className="bg-ink-dark hover:bg-ink-dark/80 px-4 sm:px-6 h-auto py-3 flex-col gap-1 text-white" onClick={() => window.open(PLAY_TESTING_URL, '_blank', 'noopener')}>
              <Play className="w-6 h-6 mb-1" />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] sm:text-xs text-white/80">{t('faq.cta.btnGooglePlayPrefix')}</span>
                <span className="text-sm font-semibold">{t('faq.cta.btnGooglePlayAction')}</span>
              </div>
            </Button>
            <Button size="lg" className="bg-ink-dark hover:bg-ink-dark/80 px-4 sm:px-6 h-auto py-3 flex-col gap-1 text-white" onClick={() => navigate('/notes')}>
              <Laptop className="w-6 h-6 mb-1" />
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] sm:text-xs text-white/80">{t('faq.cta.btnWebPrefix')}</span>
                <span className="text-sm font-semibold">{t('faq.cta.btnWebAction')}</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
