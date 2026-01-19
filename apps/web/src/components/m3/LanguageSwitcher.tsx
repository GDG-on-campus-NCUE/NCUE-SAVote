import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from './Button';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggle = () => {
        const current = i18n.language;
        const next = current.startsWith('zh') ? 'en-US' : 'zh-TW';
        i18n.changeLanguage(next);
    };

    return (
        <Button variant="text" onClick={toggle} className="w-10 h-10 p-0 rounded-full" title="Switch Language">
            <Globe className="w-5 h-5" />
            <span className="sr-only">{i18n.language}</span>
        </Button>
    );
};
