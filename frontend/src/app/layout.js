import localFont from 'next/font/local';
import "../styles/globals.scss"
import Header from '@/components/Header/Header';
import { FavoritesProvider } from '@/context/FavoritesContext';

const manrope = localFont({
  src: [
    { path: './fonts/Manrope-ExtraLight.woff2', weight: '200', style: 'normal' },
    { path: './fonts/Manrope-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/Manrope-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Manrope-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Manrope-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Manrope-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Manrope-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'AVENOR',
  description: 'Создано с помощью Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <FavoritesProvider>
          <Header />
          <main data-page-content>{children}</main>
        </FavoritesProvider>
      </body>
    </html>
  );
}