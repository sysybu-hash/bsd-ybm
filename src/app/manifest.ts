import type { MetadataRoute } from 'next';

/**
 * PWA manifest — installable on Chromium / Android; iOS uses appleWebApp metadata in layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BSD-YBM AI Solutions',
    short_name: 'BSD-YBM AI',
    description: 'מערכת ניהול בנייה מתקדמת',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FDFDFD',
    theme_color: '#FFFFFF',
    lang: 'he',
    dir: 'rtl',
    orientation: 'any',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
