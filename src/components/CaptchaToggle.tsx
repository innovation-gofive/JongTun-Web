"use client";

import { useState, useEffect } from "react";
import { useCaptchaStore } from "@/store/useCaptchaStore";
import { GlassContainer } from "@/components/ui/glass";

export function CaptchaToggle() {
  const captcha = useCaptchaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development" || !mounted) {
    return null;
  }

  return (
    <GlassContainer variant="secondary" padding="sm" className="mb-4">
      <div className="text-center">
        <div className="text-xs text-gray-600 mb-2">
          🧪 Development Mode - CAPTCHA Controls
        </div>

        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                captcha.isEnabled ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
            <span>CAPTCHA: {captcha.isEnabled ? "Enabled" : "Disabled"}</span>
            <span className="text-gray-500">(env controlled)</span>
          </div>

          {captcha.isEnabled && (
            <div className="text-gray-500">
              Status:{" "}
              {captcha.isLoading
                ? "Loading..."
                : captcha.token
                ? "✅ Ready"
                : "⚪ Idle"}
            </div>
          )}
        </div>

        {captcha.error && (
          <div className="text-xs text-red-500 mt-1">
            Error: {captcha.error}
          </div>
        )}

        <div className="mt-2 flex justify-center gap-2">
          <button
            onClick={() => captcha.execute()}
            disabled={!captcha.isEnabled || captcha.isLoading}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Test CAPTCHA
          </button>
          <button
            onClick={() => captcha.reset()}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded"
          >
            Reset
          </button>
        </div>
      </div>
    </GlassContainer>
  );
}
