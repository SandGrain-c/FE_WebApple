"use client";

import { useSyncExternalStore } from "react";

import { useCompareStore } from "@/store/compare.store";

function subscribeToCompareHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useCompareStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useCompareStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}
export function useCompareHydration() {
  return useSyncExternalStore(
    subscribeToCompareHydration,
    () => useCompareStore.persist.hasHydrated(),
    () => false,
  );
}
