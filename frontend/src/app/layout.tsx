import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIFT — Search & Information Filtering Tool',
  description: 'Search privately. Find clearly. SIFT is a self-hosted aggregate search experience built for speed, privacy, and readability.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('sift-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  const density = localStorage.getItem('sift-density') || 'comfortable';
                  document.documentElement.setAttribute('data-density', density);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
