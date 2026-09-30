import type { CSSProperties } from 'react';
import logoMark from '../assets/dom-crm-mark.png';
import logoFull from '../assets/dom-crm-logo.png';

interface AppLogoProps {
  className?: string;
  alt?: string;
  style?: CSSProperties;
  // `mark` = símbolo do ícone (cabeçalho/sidebar); `full` = arte completa (login/entrada).
  variant?: 'mark' | 'full';
  // Mantido por compatibilidade com chamadas existentes; a marca é única agora.
  forceTheme?: 'dark' | 'light';
}

export function AppLogo({ className, alt = 'Dom CRM', style, variant = 'mark' }: AppLogoProps) {
  const src = variant === 'full' ? logoFull : logoMark;

  return <img src={src} alt={alt} className={className} style={style} />;
}
