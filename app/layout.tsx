import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Crypto Bot 50 USDT Strategy & Paper Trader',
  description: 'A secure algorithmic trading bot simulator, risk calculator, and AI strategy advisor tailored for 50 USDT crypto micro-capital.',
  openGraph: {
    title: 'Crypto Bot 50 USDT Strategy & Paper Trader',
    description: 'A secure algorithmic trading bot simulator, risk calculator, and AI strategy advisor tailored for 50 USDT crypto micro-capital.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Bot 50 USDT Strategy & Paper Trader',
    description: 'A secure algorithmic trading bot simulator, risk calculator, and AI strategy advisor tailored for 50 USDT crypto micro-capital.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
