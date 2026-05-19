import { useAppStore } from '@/store/index';
import type { Language } from '@/i18n/translations';

export const LanguageSwitch = () => {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const toggle = () => {
    const next: Language = language === 'pl' ? 'en' : 'pl';
    setLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
      title={language === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}
    >
      {language === 'pl' ? 'EN' : 'PL'}
    </button>
  );
};
