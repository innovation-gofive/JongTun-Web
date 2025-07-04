// Cross-tab synchronization to prevent multi-tab abuse
// ป้องกัน Red Team จากการเปิดหลาย tab เพื่อ bypass queue

import { useCallback } from "react";

export interface TabSyncData {
  type: string;
  payload: unknown;
  timestamp: number;
  tabId: string;
}

export const useTabSync = (channelName: string) => {
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const broadcast = useCallback(
    (type: string, payload: unknown) => {
      try {
        const channel = new BroadcastChannel(channelName);
        const message: TabSyncData = {
          type,
          payload,
          timestamp: Date.now(),
          tabId,
        };

        channel.postMessage(message);
        channel.close();

        // Store in localStorage as fallback
        localStorage.setItem(`${channelName}_last`, JSON.stringify(message));
      } catch (error) {
        console.warn(
          "BroadcastChannel not supported, using localStorage only",
          error
        );
      }
    },
    [channelName, tabId]
  );

  const subscribe = useCallback(
    (
      handler: (data: TabSyncData) => void,
      filter?: (data: TabSyncData) => boolean
    ) => {
      let channel: BroadcastChannel;

      try {
        channel = new BroadcastChannel(channelName);

        const messageHandler = (event: MessageEvent<TabSyncData>) => {
          const data = event.data;

          // Ignore messages from same tab
          if (data.tabId === tabId) return;

          // Apply filter if provided
          if (filter && !filter(data)) return;

          handler(data);
        };

        channel.addEventListener("message", messageHandler);

        return () => {
          channel.removeEventListener("message", messageHandler);
          channel.close();
        };
      } catch (error) {
        console.warn("BroadcastChannel not supported", error);
        return () => {};
      }
    },
    [channelName, tabId]
  );

  // Detect if user already has active tab
  const detectExistingSession = useCallback(() => {
    try {
      const lastMessage = localStorage.getItem(`${channelName}_last`);
      if (lastMessage) {
        const data = JSON.parse(lastMessage) as TabSyncData;
        const timeDiff = Date.now() - data.timestamp;

        // If message is less than 30 seconds old, assume active session
        if (timeDiff < 30000) {
          return data;
        }
      }
    } catch (error) {
      console.warn("Error detecting existing session:", error);
    }
    return null;
  }, [channelName]);

  return {
    tabId,
    broadcast,
    subscribe,
    detectExistingSession,
  };
};

// Hook สำหรับ queue-specific synchronization
export const useQueueTabSync = () => {
  const { broadcast, subscribe, detectExistingSession, tabId } =
    useTabSync("dev-war-queue");

  const notifyQueueJoined = useCallback(
    (queueData: unknown) => {
      broadcast("QUEUE_JOINED", {
        queueData,
        joinedAt: Date.now(),
      });
    },
    [broadcast]
  );

  const notifyQueueLeft = useCallback(() => {
    broadcast("QUEUE_LEFT", {
      leftAt: Date.now(),
    });
  }, [broadcast]);

  const subscribeToQueueEvents = useCallback(
    (onQueueJoined: (data: unknown) => void, onQueueLeft: () => void) => {
      return subscribe((data) => {
        switch (data.type) {
          case "QUEUE_JOINED":
            onQueueJoined(data.payload);
            break;
          case "QUEUE_LEFT":
            onQueueLeft();
            break;
        }
      });
    },
    [subscribe]
  );

  const checkExistingQueueSession = useCallback(() => {
    const existing = detectExistingSession();
    if (existing && existing.type === "QUEUE_JOINED") {
      // Safe type assertion for queue data
      return (existing.payload as { queueData: unknown })?.queueData;
    }
    return null;
  }, [detectExistingSession]);

  return {
    tabId,
    notifyQueueJoined,
    notifyQueueLeft,
    subscribeToQueueEvents,
    checkExistingQueueSession,
  };
};
