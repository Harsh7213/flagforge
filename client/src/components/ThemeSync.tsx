import { useEffect } from 'react';
import { useAppSelector } from '../store/store';
import { applyTheme } from '../utils/applyTheme';

export default function ThemeSync() {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}