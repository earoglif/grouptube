import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getSubscriptionsSnapshot,
  requestSubscriptions,
  subscribeToSubscriptions,
} from "../../shared/services/stores/subscriptions-store";

export function useSubscriptions() {
  const subscriptionsSnapshot = useSyncExternalStore(
    (onChange) => subscribeToSubscriptions(() => onChange(), true),
    getSubscriptionsSnapshot,
    getSubscriptionsSnapshot
  );

  useEffect(() => {
    requestSubscriptions();
  }, []);

  const refresh = useCallback(() => {
    requestSubscriptions();
  }, []);

  return {
    subscriptions: subscriptionsSnapshot.subscriptions,
    isLoading: subscriptionsSnapshot.isLoading,
    authRequired: subscriptionsSnapshot.authRequired,
    refresh,
  };
}
