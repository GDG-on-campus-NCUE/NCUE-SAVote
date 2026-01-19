import { useThemeStore } from '../../stores/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './Button';

export const ThemeToggle = () => {
    const { mode, setMode } = useThemeStore();

    const toggle = () => {
        if (mode === 'light') setMode('dark');
        else if (mode === 'dark') setMode('system');
        else setMode('light');
    };

    const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;

    return (
        <Button variant="text" onClick={toggle} className="w-10 h-10 p-0 rounded-full" title={`Theme: ${mode}`}>
            <Icon className="w-5 h-5" />
        </Button>
    );
};
