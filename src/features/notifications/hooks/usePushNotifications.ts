"use client";

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/infrastructure/trpc/client";

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

// VAPID public key should be in env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/**
 * Convert a base64 string to a Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Hook for managing Web Push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isEnabled: false,
    isLoading: true,
    permission: null,
    subscription: null,
    error: null,
  });

  // tRPC mutations
  const subscribeMutation = trpc.notification.subscribePush.useMutation();
  const unsubscribeMutation = trpc.notification.unsubscribePush.useMutation();
  const testNotificationMutation = trpc.notification.testPush.useMutation();

  // Check browser support and current state on mount
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }));
        return;
      }

      const permission = Notification.permission;

      // Check for existing subscription
      let subscription: PushSubscription | null = null;
      try {
        const registration = await navigator.serviceWorker.ready;
        subscription = await registration.pushManager.getSubscription();
      } catch (error) {
        console.error("Error checking push subscription:", error);
      }

      setState({
        isSupported: true,
        isEnabled: subscription !== null,
        isLoading: false,
        permission,
        subscription,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
        setState((prev) => ({
          ...prev,
          error: "Service Worker registration failed",
        }));
      });
  }, []);

  /**
   * Request notification permission from the user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({
        ...prev,
        permission,
      }));
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [state.isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Push notifications are not supported",
      }));
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      setState((prev) => ({
        ...prev,
        error: "VAPID key not configured",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Notification permission denied",
          }));
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create one
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }

      // Send subscription to server
      const subscriptionJSON = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscriptionJSON.endpoint!,
        p256dh: subscriptionJSON.keys!.p256dh,
        auth: subscriptionJSON.keys!.auth,
      });

      setState((prev) => ({
        ...prev,
        isEnabled: true,
        isLoading: false,
        subscription,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to subscribe",
      }));
      return false;
    }
  }, [state.isSupported, requestPermission, subscribeMutation]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe();

      // Remove subscription from server
      await unsubscribeMutation.mutateAsync({
        endpoint: state.subscription.endpoint,
      });

      setState((prev) => ({
        ...prev,
        isEnabled: false,
        isLoading: false,
        subscription: null,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to unsubscribe",
      }));
      return false;
    }
  }, [state.subscription, unsubscribeMutation]);

  /**
   * Send a test notification
   */
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!state.isEnabled) {
      return;
    }

    try {
      await testNotificationMutation.mutateAsync();
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }, [state.isEnabled, testNotificationMutation]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
