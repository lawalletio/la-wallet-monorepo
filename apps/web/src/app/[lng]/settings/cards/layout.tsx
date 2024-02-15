import { CardsProvider } from '@/context/CardsContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cards - LaWallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <CardsProvider>{children}</CardsProvider>;
}
