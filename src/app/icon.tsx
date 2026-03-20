import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

/** App icon + PWA icon (PNG via ImageResponse — broad browser support). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FF8C00',
          borderRadius: 48,
          fontSize: 96,
          color: 'white',
          fontWeight: 900,
          fontFamily: 'system-ui, Segoe UI, sans-serif',
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
