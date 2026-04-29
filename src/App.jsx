import { useState, useEffect, useMemo } from 'react';
import { OrbcafeI18nProvider } from 'orbcafe-ui';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Globe, Moon, Sun } from 'lucide-react';
import SapOrderPage from './SapOrderPage';
import orbisLogo from './orbis-logo-official.svg';
import { sapOrderDict } from './i18n/sapOrderDict';
import { formatMessage } from './i18n/formatMessage';

export default function App() {
  const [locale, setLocale] = useState('zh');
  const [themeMode, setThemeMode] = useState('light');
  const t = (key, params = {}) => formatMessage(sapOrderDict, locale, key, params);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const nextTheme = prefersDark ? 'dark' : 'light';
      setThemeMode(nextTheme);
      applyTheme(nextTheme);
    }
  }, []);

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const renderThemeIcon = () => {
    if (themeMode === 'dark') return <Moon className="w-[18px] h-[18px]" />;
    return <Sun className="w-[18px] h-[18px]" />;
  };

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
      }),
    [themeMode],
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <OrbcafeI18nProvider locale={locale}>
        <div className={`min-h-screen flex flex-col ${themeMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-[#F3F4F6] text-gray-900'}`}>
          <header className={`${themeMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} h-16 border-b flex items-center justify-between gap-3 px-4 lg:px-6 shrink-0 relative z-50 transition-colors`}>
            <div className="flex min-w-[400px] shrink-0 items-center gap-3 overflow-visible">
              <img
                src={orbisLogo}
                alt="Orbis"
                className="block h-9 w-auto shrink-0 object-contain"
              />
              <span className={`whitespace-nowrap font-bold text-[16px] ${themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {t('appTitle')}
              </span>
            </div>

            <div className={`flex shrink-0 items-center gap-4 lg:gap-6 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm justify-end`}>
              <div className={`flex items-center gap-1.5 cursor-pointer ${themeMode === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} group`}>
                <Globe className="w-4 h-4" />
                <select
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
                  className={`appearance-none bg-transparent outline-none cursor-pointer font-medium ${themeMode === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} focus:outline-none`}
                >
                  <option value="zh" className="text-black">中文</option>
                  <option value="en" className="text-black">English</option>
                  <option value="de" className="text-black">Deutsch</option>
                </select>
              </div>

              <div
                onClick={toggleTheme}
                className={`cursor-pointer ${themeMode === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} flex items-center justify-center`}
                title={t('toggleTheme')}
              >
                {renderThemeIcon()}
              </div>

              <div className={`flex items-center gap-3 pl-2 border-l ${themeMode === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex flex-col items-end justify-center">
                  <span className={`font-bold ${themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'} leading-tight text-[13px]`}>Haorong Liu</span>
                  <span className={`text-[11px] ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-400'} leading-tight mt-0.5`}>haorong.liu@orbis.de</span>
                </div>
                <div className={`w-9 h-9 rounded-full ${themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-500'} flex items-center justify-center font-bold border`}>
                  H
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto relative z-10">
            <SapOrderPage locale={locale} theme={themeMode} />
          </main>
        </div>
      </OrbcafeI18nProvider>
    </ThemeProvider>
  );
}
