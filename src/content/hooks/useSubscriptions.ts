import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getLastSubscriptions,
  requestSubscriptions,
  subscribeToSubscriptions,
} from "../../shared/services/stores/subscriptions-store";

export function useSubscriptions() {
  const subscriptions = useSyncExternalStore(
    (onChange) => subscribeToSubscriptions(() => onChange(), true),
    () => getLastSubscriptions(),
    () => getLastSubscriptions()
  );
  const isLoading = subscriptions.length === 0;

  useEffect(() => {
    requestSubscriptions();
  }, []);

  const refresh = useCallback(() => {
    requestSubscriptions();
  }, []);

  return {
    subscriptions,
    isLoading,
    refresh,
  };
}
