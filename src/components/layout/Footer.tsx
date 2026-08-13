import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import { LANG_STORAGE_KEY } from '@/i18n';
import { APP_STORE_URL, PLAY_TESTING_URL, CHROME_STORE_URL } from '@/lib/storeLinks';
import { useLocalePath, counterpartPath } from '@/lib/localePath';
import { useLocation, useNavigate } from 'react-router-dom';

export function Footer() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lp = useLocalePath();
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('footer.title'),
          text: t('footer.desc'),
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      showMessage(t('footer.msg.copy'));
    }
  };

  const handleLanguage = () => {
    const nextLang = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(nextLang);
    // 저장해 둬야 새로고침·다른 페이지 이동 때도 유지된다. 저장된 선택이
    // 있으면 LanguageGate의 자동 전환도 더는 끼어들지 않는다.
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {
      // 프라이빗 모드 등 — 이번 방문 동안만 유지된다
    }
    /*
      언어가 주소에 있으므로 주소도 함께 옮긴다 — 안 옮기면 `/en`에서 한국어가
      뜨거나 그 반대가 되어, 사용자가 본 화면과 공유되는 링크가 어긋난다.
      담기 창·생각 노트는 언어 주소가 없으므로 그대로 둔다.
    */
    if (pathname !== '/save' && pathname !== '/notes') {
      navigate(counterpartPath(pathname, nextLang), { replace: true });
    }
    showMessage(nextLang === 'ko' ? '언어가 한국어로 변경되었습니다.' : 'Language changed to English.');
  };

  return (
    <footer className="bg-surface-paper pt-20 pb-10 border-t border-surface-amber/30">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
          <div className="flex items-center gap-2 text-chaerok-600 mb-4">
            <img src={logoImg} alt="채록 로고" className="w-10 h-10 object-contain" />
            <span className="font-serif font-semibold text-2xl tracking-tight">{t('footer.title')}</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-8 text-sm text-ink-muted font-medium">
              <Link to={lp("/privacy")} className="hover:text-ink-dark transition-colors">{t('footer.link.privacy')}</Link>
              <Link to={lp("/terms")} className="hover:text-ink-dark transition-colors">{t('footer.link.terms')}</Link>
              <Link to={lp("/delete-account")} className="hover:text-ink-dark transition-colors">{t('footer.link.deleteAccount')}</Link>
              <a href="https://komjirak.studio" target="_blank" rel="noopener noreferrer" className="hover:text-ink-dark transition-colors">{t('footer.link.contact')}</a>
            </div>
            {/* 받는 곳 — 히어로와 같은 링크(storeLinks 단일 출처). 스토어 이름은 고유명사라 번역하지 않는다 */}
            <div className="flex flex-wrap gap-8 text-sm text-ink-muted font-medium">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink-dark transition-colors">App Store</a>
              <a href={PLAY_TESTING_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink-dark transition-colors">Google Play</a>
              <Link to="/notes" className="hover:text-ink-dark transition-colors">Web App</Link>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink-dark transition-colors">Chrome Extension</a>
            </div>
          </div>
          
          <div className="flex gap-4 relative">
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-surface-amber/50 flex items-center justify-center text-ink-dark hover:bg-surface-amber transition-colors" aria-label="Share">
              <Share2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button onClick={handleLanguage} className="w-10 h-10 rounded-full bg-surface-amber/50 flex items-center justify-center text-ink-dark hover:bg-surface-amber transition-colors" aria-label="Website Language">
              <Globe className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {message && (
              <div className="absolute -top-12 right-0 bg-ink-dark text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-ambient z-10 animate-fade-in">
                {message}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center md:text-left text-sm text-ink-muted/70">
          {t('footer.copy')}
        </div>
      </div>
    </footer>
  );
}
