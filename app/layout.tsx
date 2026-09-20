import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Crypto Bot $7.40 Strategy & Paper Trader',
  description: 'A secure algorithmic scalping bot simulator, risk calculator, and AI strategy advisor tailored for $7.40 crypto micro-capital on BingX.',
  openGraph: {
    title: 'Crypto Bot $7.40 Strategy & Paper Trader',
    description: 'A secure algorithmic scalping bot simulator, risk calculator, and AI strategy advisor tailored for $7.40 crypto micro-capital on BingX.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Bot $7.40 Strategy & Paper Trader',
    description: 'A secure algorithmic scalping bot simulator, risk calculator, and AI strategy advisor tailored for $7.40 crypto micro-capital on BingX.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
