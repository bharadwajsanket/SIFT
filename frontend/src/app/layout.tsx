import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppearanceProvider } from '@/context/AppearanceContext';
import { AIProvider } from '@/context/AIContext';

export const metadata: Metadata = {
  title: 'SIFT — Search & Information Filtering Tool',
  description: 'Search without noise. SIFT is a personal, private search workstation built for speed, privacy, and clarity.',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#090a10',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('sift_appearance_v1');
                  var cfg = raw ? JSON.parse(raw) : null;
                  
                  var theme = (cfg && cfg.theme) || localStorage.getItem('sift-theme') || 'dark';
                  if (theme === 'system') {
                    var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  } else {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                  
                  var visualStyle = (cfg && cfg.visualStyle) || 'glass';
                  document.documentElement.setAttribute('data-visual-style', visualStyle);
                  
                  var density = (cfg && cfg.density) || localStorage.getItem('sift-density') || 'comfortable';
                  document.documentElement.setAttribute('data-density', density);
                  
                  var motion = (cfg && cfg.motion) || 'full';
                  document.documentElement.setAttribute('data-motion', motion);
                  
                  if (cfg) {
                    var root = document.documentElement;
                    if (cfg.wallpaperSource === 'official') {
                      var wallMap = {
                        'mountain': '/wallpapers/sift-mountain.jpg',
                        'mist': '/wallpapers/sift-mist.jpg',
                        'obsidian': '/wallpapers/sift-obsidian.jpg',
                        'twilight': '/wallpapers/sift-twilight.jpg',
                        'celestial': '/wallpapers/sift-celestial.jpg'
                      };
                      var wUrl = wallMap[cfg.wallpaperId] || '/wallpapers/sift-mountain.jpg';
                      root.style.setProperty('--bg-wallpaper', "url('" + wUrl + "')");
                    } else if (cfg.wallpaperSource === 'url' && cfg.wallpaperCustomUrl) {
                      root.style.setProperty('--bg-wallpaper', "url('" + cfg.wallpaperCustomUrl + "')");
                    }
                    
                    if (typeof cfg.wallpaperOpacity === 'number') {
                      root.style.setProperty('--bg-wallpaper-opacity', cfg.wallpaperOpacity);
                    }
                    if (typeof cfg.wallpaperBlur === 'number') {
                      root.style.setProperty('--bg-wallpaper-blur', cfg.wallpaperBlur + 'px');
                    }
                    if (typeof cfg.wallpaperScale === 'number') {
                      root.style.setProperty('--bg-wallpaper-scale', cfg.wallpaperScale);
                    }
                    if (cfg.wallpaperPosition) {
                      root.style.setProperty('--bg-wallpaper-position', cfg.wallpaperPosition);
                    }
                    if (typeof cfg.overlayDarkness === 'number') {
                      var d = cfg.overlayDarkness;
                      root.style.setProperty('--overlay-scrim', 'rgba(8, 7, 15, ' + d + ')');
                      root.style.setProperty('--overlay-gradient', 'linear-gradient(180deg, rgba(9, 10, 16, ' + Math.max(0, d - 0.2) + ') 0%, rgba(9, 10, 16, ' + d + ') 45%, rgba(8, 7, 15, ' + Math.min(1, d + 0.35) + ') 100%)');
                    }
                    if (typeof cfg.glassOpacity === 'number') {
                      root.style.setProperty('--glass-surface', 'rgba(18, 16, 28, ' + cfg.glassOpacity + ')');
                    }
                    if (typeof cfg.glassBlur === 'number') {
                      root.style.setProperty('--glass-blur', cfg.glassBlur + 'px');
                    }
                    if (cfg.accentColor) {
                      root.style.setProperty('--accent', cfg.accentColor);
                      root.style.setProperty('--accent-surface', cfg.accentColor + '1f');
                      root.style.setProperty('--accent-border', cfg.accentColor + '47');
                      root.style.setProperty('--accent-glow', cfg.accentColor + '40');
                    }
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <AppearanceProvider>
          <AIProvider>
            <div className="siftAtmosphere" aria-hidden="true">
              <div className="siftBackgroundLayer" />
              <div className="siftOverlayLayer" />
            </div>
            <div className="siftAppRoot">
              {children}
            </div>
          </AIProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
