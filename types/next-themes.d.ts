declare module 'next-themes' {
  import * as React from 'react';

  export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
    attribute?: string | 'class';
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableColorScheme?: boolean;
    themes?: string[];
    value?: {
      [key: string]: string;
    };
  }

  export const ThemeProvider: React.FC<ThemeProviderProps>;
  
  export interface UseThemeProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
    systemTheme: 'light' | 'dark' | null;
    resolvedTheme: string | undefined;
  }

  export function useTheme(): UseThemeProps;
  
  export const Theme: React.FC<{
    children: (context: UseThemeProps) => React.ReactNode;
  }>;
  
  export const useThemeContext: () => UseThemeProps;
  
  export const ThemeToggle: React.FC<{
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }>;
  
  export const ThemeSwitcher: React.FC<{
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }>;
  
  export default function NextThemesProvider(
    props: ThemeProviderProps
  ): JSX.Element;
}
