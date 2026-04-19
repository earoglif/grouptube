import type { Subscription } from "../types";

type GuideSubscriptionItemProps = {
  subscription: Subscription;
  currentPathname: string;
};

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

function isActiveSubscriptionPath(channelId: string, currentPathname: string): boolean {
  const normalizedPathname = normalizePathname(currentPathname);
  const channelPath = `/channel/${channelId}`;
  return normalizedPathname === channelPath || normalizedPathname.startsWith(`${channelPath}/`);
}

export function GuideSubscriptionItem({ subscription, currentPathname }: GuideSubscriptionItemProps) {
  const isActive = isActiveSubscriptionPath(subscription.channelId, currentPathname);

  return (
    <a
      className={`guide-sub-item${isActive ? " is-active" : ""}`}
      href={`/channel/${subscription.channelId}`}
      title={subscription.name}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="guide-sub-avatar-wrap" aria-hidden="true">
        {subscription.thumbnailUrl ? (
          <img
            className="guide-sub-avatar"
            src={subscription.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="guide-sub-avatar-fallback" />
        )}
      </span>
      <span className="guide-sub-name">{subscription.name}</span>
    </a>
  );
}
