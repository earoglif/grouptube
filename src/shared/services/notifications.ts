export type NotificationType = "success" | "error" | "info";

export type NotificationMessage = {
  id: string;
  type: NotificationType;
  text: string;
};

type NotificationListener = (message: NotificationMessage) => void;

const listeners = new Set<NotificationListener>();

function emit(type: NotificationType, text: string): void {
  const message: NotificationMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    text,
  };

  for (const listener of listeners) {
    listener(message);
  }
}

export const notify = {
  success(text: string) {
    emit("success", text);
  },
  error(text: string) {
    emit("error", text);
  },
  info(text: string) {
    emit("info", text);
  },
};

export function subscribeToNotifications(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
