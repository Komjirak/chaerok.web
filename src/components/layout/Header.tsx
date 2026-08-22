import { useState, useEffect } from 'react';
import { useLocalePath } from '@/lib/localePath';
import { Button } from '../ui/Button';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '@/assets/logo.png';
import { useDevice, openAppStore } from '@/lib/appDownload';

export function Header() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  // 영어 페이지에서는 링크도 /en 아래로 — 안 그러면 메뉴 한 번에 한국어로 떨어진다
  const lp = useLocalePath();
  const device = useDevice();

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  // 페이지에서 가장 눈에 띄는 상시 버튼 — 예전엔 /notes(읽기 전용 웹 뷰어)로
  // 갔다. 로그인 없는 방문자에게는 빈 화면이라, 방문 기기의 스토어로 보낸다.
  const download = () => {
    closeMenu();
    openAppStore('dl_header', device);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface-paper/80 border-b border-surface-amber/30">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
        <Link to={lp("/")} onClick={closeMenu} className="flex items-center gap-2 text-chaerok-600 hover:text-chaerok-800 transition-colors">
          <img src={logoImg} alt="채록 로고" className="w-8 h-8 object-contain" />
          <span className="font-serif font-semibold text-xl tracking-tight">{t('header.title')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to={lp("/#features")} className="text-sm font-medium text-ink-muted hover:text-chaerok-600 transition-colors">{t('header.nav.features')}</Link>
          <Link to={lp("/#ontology")} className="text-sm font-medium text-ink-muted hover:text-chaerok-600 transition-colors">{t('header.nav.ontology')}</Link>
          <Link to={lp("/#pricing")} className="text-sm font-medium text-ink-muted hover:text-chaerok-600 transition-colors">{t('header.nav.pricing')}</Link>
          <Link to={lp("/#faq")} className="text-sm font-medium text-ink-muted hover:text-chaerok-600 transition-colors">{t('header.nav.faq')}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Button size="sm" onClick={download}>{t('header.try')}</Button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-ink-muted hover:text-chaerok-600 hover:bg-surface-amber/40 focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-surface-paper/95 backdrop-blur-lg border-b border-surface-amber/40 shadow-lg"
          >
            <nav className="flex flex-col px-5 py-4 space-y-3">
              <Link
                to="/#features"
                onClick={closeMenu}
                className="py-2 text-base font-medium text-ink-dark hover:text-chaerok-600 border-b border-surface-amber/20 transition-colors"
              >
                {t('header.nav.features')}
              </Link>
              <Link
                to="/#ontology"
                onClick={closeMenu}
                className="py-2 text-base font-medium text-ink-dark hover:text-chaerok-600 border-b border-surface-amber/20 transition-colors"
              >
                {t('header.nav.ontology')}
              </Link>
              <Link
                to="/#pricing"
                onClick={closeMenu}
                className="py-2 text-base font-medium text-ink-dark hover:text-chaerok-600 border-b border-surface-amber/20 transition-colors"
              >
                {t('header.nav.pricing')}
              </Link>
              <Link
                to="/#faq"
                onClick={closeMenu}
                className="py-2 text-base font-medium text-ink-dark hover:text-chaerok-600 border-b border-surface-amber/20 transition-colors"
              >
                {t('header.nav.faq')}
              </Link>
              <div className="pt-2 sm:hidden">
                <Button size="sm" className="w-full justify-center" onClick={download}>{t('header.try')}</Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
