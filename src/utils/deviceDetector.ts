/**
 * Device & Screen Resolution Detection Utility
 * Automatically analyzes viewport, physical resolution, device pixel ratio (DPR),
 * and aspect ratios to optimize layout scaling for high-density phones (e.g. 2712x1220).
 */

export interface DeviceScreenInfo {
  // Physical resolution in device hardware pixels (e.g., 1220 x 2712)
  physicalWidth: number;
  physicalHeight: number;
  
  // CSS logical viewport dimensions (e.g., 443 x 986)
  viewportWidth: number;
  viewportHeight: number;
  
  // Device Pixel Ratio (e.g., 2.75)
  dpr: number;
  
  // Aspect ratio (height / width in portrait)
  aspectRatio: number;
  
  // Device classifications
  isTouch: boolean;
  isMobileUA: boolean;
  isPhone: boolean;
  isTablet: boolean;
  
  // Screen profile categories
  isHighResPhone: boolean;   // e.g. 2712x1220, 1080x2400, or DPR >= 2.5
  isTallPhone: boolean;      // Aspect ratio >= 2.0 or CSS height >= 840px
  isSpaciousHeight: boolean; // Viewport height >= 840px
  isCompactHeight: boolean;  // Viewport height < 680px
  
  // Screen profile label for diagnostics & UI
  screenProfileLabel: string;
}

export const detectDeviceScreen = (): DeviceScreenInfo => {
  if (typeof window === 'undefined') {
    return {
      physicalWidth: 1024,
      physicalHeight: 768,
      viewportWidth: 1024,
      viewportHeight: 768,
      dpr: 1,
      aspectRatio: 1,
      isTouch: false,
      isMobileUA: false,
      isPhone: false,
      isTablet: false,
      isHighResPhone: false,
      isTallPhone: false,
      isSpaciousHeight: false,
      isCompactHeight: false,
      screenProfileLabel: 'Server / SSR',
    };
  }

  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const sw = window.screen.width;
  const sh = window.screen.height;

  // Calculate physical screen resolution
  const physicalWidth = Math.round(sw * dpr);
  const physicalHeight = Math.round(sh * dpr);

  const ua = navigator.userAgent || '';
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isTouch = Boolean(
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0
  );

  // Phone classification: CSS width < 600px or Mobile UA with mobile token
  const isPhone = Boolean(
    (vw < 600 && isTouch) ||
    /iPhone|iPod|Android.*Mobile/i.test(ua)
  );

  // Tablet classification: Touch device with width between 600px and 1200px, or iPad/Android non-mobile UA
  const isTablet = Boolean(
    !isPhone && (
      (isTouch && vw >= 600 && vw <= 1200) ||
      /iPad|Android(?!.*Mobile)/i.test(ua)
    )
  );

  // Aspect ratio in portrait mode
  const portraitHeight = Math.max(vh, vw);
  const portraitWidth = Math.min(vh, vw);
  const aspectRatio = portraitWidth > 0 ? portraitHeight / portraitWidth : 1;

  // Modern high-res phones: physical width >= 1080 or physical height >= 2300, or DPR >= 2.5 on a phone
  const isHighResPhone = Boolean(
    isPhone && (
      dpr >= 2.4 ||
      physicalWidth >= 1080 ||
      physicalHeight >= 2300 ||
      (sw >= 390 && dpr >= 2.5)
    )
  );

  // Tall phone: 19.5:9, 20:9, 20.5:9 (aspect ratio >= 2.0) or CSS viewport height >= 840px
  const isTallPhone = Boolean(isPhone && (aspectRatio >= 2.0 || vh >= 840));

  const isSpaciousHeight = vh >= 840;
  const isCompactHeight = vh < 680;

  // Descriptive label
  let screenProfileLabel = 'Standard Display';
  if (isPhone) {
    if (isHighResPhone && isTallPhone) {
      screenProfileLabel = `High-Res Phone (${physicalHeight}×${physicalWidth} • ${dpr.toFixed(1)}x DPR)`;
    } else if (isHighResPhone) {
      screenProfileLabel = `High-Density Phone (${physicalHeight}×${physicalWidth})`;
    } else if (isTallPhone) {
      screenProfileLabel = 'Tall Aspect Phone';
    } else {
      screenProfileLabel = 'Standard Phone';
    }
  } else if (isTablet) {
    screenProfileLabel = `Tablet (${vw}×${vh})`;
  } else {
    screenProfileLabel = `Desktop (${vw}×${vh})`;
  }

  return {
    physicalWidth,
    physicalHeight,
    viewportWidth: vw,
    viewportHeight: vh,
    dpr,
    aspectRatio,
    isTouch,
    isMobileUA,
    isPhone,
    isTablet,
    isHighResPhone,
    isTallPhone,
    isSpaciousHeight,
    isCompactHeight,
    screenProfileLabel,
  };
};
