import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon. */
export default function AppleIcon() {
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
          borderRadius: 40,
          fontSize: 88,
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
