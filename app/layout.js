export const metadata = {
  title: 'CouZ Mobile App',
  description: 'スマホ向けのシンプルなWebアプリ',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
