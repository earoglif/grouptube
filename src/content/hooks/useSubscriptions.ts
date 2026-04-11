import { useCallback, useEffect, useState } from "react";
import { getLastSubscriptions, requestSubscriptions, subscribeToSubscriptions } from "../services/subscriptions";
import type { Subscription } from "../types";

const LOAD_TIMEOUT_MS = 3000;

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => getLastSubscriptions());
  const [isLoading, setIsLoading] = useState(subscriptions.length === 0);

  useEffect(() => {
    const unsubscribe = subscribeToSubscriptions((nextSubscriptions) => {
      setSubscriptions(nextSubscriptions);
      setIsLoading(false);
    });

    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    requestSubscriptions();

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    requestSubscriptions();
  }, []);

  return {
    subscriptions,
    isLoading,
    refresh,
  };
}
