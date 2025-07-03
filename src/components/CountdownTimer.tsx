"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";
import { GlassContainer, glassClasses } from "@/components/ui/glass";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Set target time to tomorrow at 15:00 (3:00 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0); // 15:00 (3:00 PM)

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = tomorrow.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calculate initial time
    setTimeLeft(calculateTimeLeft());

    // Set up interval to update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  if (isExpired) {
    return (
      <div className="relative z-10">
        <div className="text-center py-8">
          <Calendar
            className={`w-8 h-8 mx-auto mb-2 ${glassClasses.text.primary}`}
          />
          <h2 className={`text-2xl font-bold ${glassClasses.text.primary}`}>
            Event Started!
          </h2>
          <p className={`${glassClasses.text.secondary}`}>
            The reservation system is now live
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="text-center py-6">
        <div className="mb-3">
          <Clock
            className={`w-6 h-6 mx-auto mb-2 ${glassClasses.text.primary}`}
          />
          <h2 className={`text-lg font-bold mb-1 ${glassClasses.text.primary}`}>
            Event Starts In
          </h2>
          <p className={`text-sm ${glassClasses.text.secondary}`}>
            Tomorrow at 3:00 PM
          </p>
        </div>

        <GlassContainer variant="subtle" padding="md" className="shadow-lg">
          <div className="grid grid-cols-4 gap-3">
            {/* Days */}
            <div className="text-center">
              <GlassContainer
                variant="subtle"
                padding="sm"
                className="backdrop-blur-sm"
              >
                <div
                  className={`text-4xl md:text-5xl font-bold mb-1 ${glassClasses.text.primary}`}
                >
                  {formatNumber(timeLeft.days)}
                </div>
                <div className={`text-xs font-medium ${glassClasses.text.muted}`}>
                  Days
                </div>
              </GlassContainer>
            </div>

            {/* Hours */}
            <div className="text-center">
              <GlassContainer
                variant="subtle"
                padding="sm"
                className="backdrop-blur-sm"
              >
                <div
                  className={`text-4xl md:text-5xl font-bold mb-1 ${glassClasses.text.primary}`}
                >
                  {formatNumber(timeLeft.hours)}
                </div>
                <div className={`text-xs font-medium ${glassClasses.text.muted}`}>
                  Hours
                </div>
              </GlassContainer>
            </div>

            {/* Minutes */}
            <div className="text-center">
              <GlassContainer
                variant="subtle"
                padding="sm"
                className="backdrop-blur-sm"
              >
                <div
                  className={`text-4xl md:text-5xl font-bold mb-1 ${glassClasses.text.primary}`}
                >
                  {formatNumber(timeLeft.minutes)}
                </div>
                <div className={`text-xs font-medium ${glassClasses.text.muted}`}>
                  Minutes
                </div>
              </GlassContainer>
            </div>

            {/* Seconds */}
            <div className="text-center">
              <GlassContainer
                variant="subtle"
                padding="sm"
                className="backdrop-blur-sm"
              >
                <div
                  className={`text-4xl md:text-5xl font-bold mb-1 ${glassClasses.text.primary}`}
                >
                  {formatNumber(timeLeft.seconds)}
                </div>
                <div className={`text-xs font-medium ${glassClasses.text.muted}`}>
                  Seconds
                </div>
              </GlassContainer>
            </div>
          </div>
        </GlassContainer>
      </div>
    </div>
  );
}
