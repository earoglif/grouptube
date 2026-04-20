import { useCallback, useEffect, useRef, useState } from "react";
import { markChannelSeen, requestChannelNewness } from "../services/newness";
import type { ChannelId, Subscription } from "../types";

type UseChannelNewnessResult = {
  newnessMap: Map<ChannelId, boolean>;
  markSeen: (channelId: ChannelId) => void;
};

export function useChannelNewness(subscriptions: Subscription[]): UseChannelNewnessResult {
  const [newnessMap, setNewnessMap] = useState<Map<ChannelId, boolean>>(() => new Map());
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (subscriptions.length === 0) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let isCancelled = false;
    const channelIds = subscriptions.map((sub) => sub.channelId);

    requestChannelNewness(channelIds)
      .then((nextMap) => {
        if (!isCancelled) {
          setNewnessMap(nextMap);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load channel newness", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [subscriptions]);

  const markSeen = useCallback((channelId: ChannelId) => {
    setNewnessMap((prev) => {
      if (!prev.get(channelId)) return prev;
      const next = new Map(prev);
      next.set(channelId, false);
      return next;
    });

    void markChannelSeen(channelId).catch((error: unknown) => {
      console.error("Failed to mark channel seen", error);
    });
  }, []);

  return { newnessMap, markSeen };
}
