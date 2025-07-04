"use client";

import { useEffect, useRef } from "react";
import { getCaptchaConfig } from "@/lib/captcha";

interface CaptchaLoaderProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Component สำหรับโหลด reCAPTCHA script
export function CaptchaLoader({ onLoad, onError }: CaptchaLoaderProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    const config = getCaptchaConfig();

    // Skip if CAPTCHA disabled
    if (!config.enabled || !config.siteKey || loadedRef.current) {
      return;
    }

    // Check if already loaded
    if (window.grecaptcha) {
      loadedRef.current = true;
      onLoad?.();
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${config.siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      loadedRef.current = true;
      // Wait for grecaptcha to be ready
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          onLoad?.();
        });
      } else {
        onLoad?.();
      }
    };

    script.onerror = () => {
      const error = new Error("Failed to load reCAPTCHA script");
      console.error("reCAPTCHA load error:", error);
      onError?.(error);
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onLoad, onError]);

  // This component doesn't render anything visible
  return null;
}

interface CaptchaProviderProps {
  children: React.ReactNode;
}

// Provider component ที่ wrap ทั้งแอป
export function CaptchaProvider({ children }: CaptchaProviderProps) {
  const handleLoad = () => {
    console.log("reCAPTCHA loaded successfully");
  };

  const handleError = (error: Error) => {
    console.error("reCAPTCHA load error:", error);
    // Don't throw error - just log it
  };

  return (
    <>
      <CaptchaLoader onLoad={handleLoad} onError={handleError} />
      {children}
    </>
  );
}
