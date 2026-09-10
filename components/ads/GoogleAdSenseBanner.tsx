'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

interface GoogleAdSenseBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ADSENSE_CLIENT_ID = 'ca-pub-4078466828008985';

export function GoogleAdSenseBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
}: GoogleAdSenseBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Avoid double-pushing to the same <ins> element in React StrictMode
    if (pushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const ins = adRef.current;
        // Only push if the ad unit hasn't been initialized yet
        if (ins && !ins.getAttribute('data-adsbygoogle-status')) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
        }
      }
    } catch (err) {
      console.warn('Google AdSense render notice:', err);
    }
  }, []);

  return (
    <div className={`w-full my-6 text-center overflow-hidden ${className}`}>
      {/* Load AdSense script only on pages where ad units actually render */}
      <Script
        id="google-adsense-script"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

      <div className="max-w-7xl mx-auto px-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-2 sm:p-3 transition-all">
          <div className="flex items-center justify-between pb-1 px-1 text-[10px] uppercase font-bold tracking-widest text-slate-400">
            <span>Advertisement</span>
            <span className="text-[9px] font-medium text-slate-400/80">Google Ad</span>
          </div>

          <div className="w-full overflow-hidden flex items-center justify-center min-h-[90px] sm:min-h-[100px] rounded-xl bg-white border border-dashed border-slate-200">
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{
                display: 'block',
                width: '100%',
                minHeight: '90px',
                textAlign: 'center',
                ...style,
              }}
              data-ad-client={ADSENSE_CLIENT_ID}
              {...(slot ? { 'data-ad-slot': slot } : {})}
              data-ad-format={format}
              data-full-width-responsive={responsive ? 'true' : 'false'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
