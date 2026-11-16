import localFont from 'next/font/local';
import "../styles/globals.scss"
import Header from '@/components/Header/Header';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { SessionProvider } from '@/context/SessionContext';
import { getCurrentUser } from '@/lib/auth';
import { getFavoriteIds } from '@/lib/cars';
import CompareBar from '@/components/Compare/CompareBar';

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
  description: 'AVENOR — a curated collection of exceptional automobiles.',
}

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const favoriteIds = user ? await getFavoriteIds(user.id) : [];

  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <SessionProvider user={user}>
          <FavoritesProvider initialIds={favoriteIds}>
            <Header />
            <main data-page-content>{children}</main>
            <CompareBar />
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
