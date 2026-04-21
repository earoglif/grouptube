import { useEffect, useState } from "react";
import {
  subscribeToNotifications,
  type NotificationMessage,
} from "../../shared/services/notifications";

const TOAST_TTL_MS = 3500;

export function ToastHost() {
  const [items, setItems] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    return subscribeToNotifications((message) => {
      setItems((prev) => [...prev, message]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== message.id));
      }, TOAST_TTL_MS);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            minWidth: 220,
            maxWidth: 360,
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            color: item.type === "error" ? "#7f1d1d" : item.type === "success" ? "#14532d" : "#1f2937",
            background:
              item.type === "error" ? "#fee2e2" : item.type === "success" ? "#dcfce7" : "#e5e7eb",
            border:
              item.type === "error"
                ? "1px solid #fecaca"
                : item.type === "success"
                  ? "1px solid #bbf7d0"
                  : "1px solid #d1d5db",
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
