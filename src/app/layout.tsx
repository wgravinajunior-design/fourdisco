import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FourDisco | Sistema de Check-in, Portaria & Gestão VIP',
  description: 'Controle de portaria inteligente com reconhecimento de foto de documento, detecção de festas do dia, check-out e gestão de blacklist por período ou indeterminado.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#08080d] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
