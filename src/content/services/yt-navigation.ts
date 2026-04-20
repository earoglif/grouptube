import type React from "react";

type YtNavigateOptions = {
  url: string;
  browseId?: string;
};

function isModifiedClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function navigateYouTubeSpa({ url, browseId }: YtNavigateOptions): void {
  const target = document.querySelector("ytd-app") ?? document.body;
  const detail = {
    endpoint: {
      commandMetadata: {
        webCommandMetadata: {
          url,
          webPageType: "WEB_PAGE_TYPE_CHANNEL",
          rootVe: 3611,
        },
      },
      ...(browseId ? { browseEndpoint: { browseId } } : {}),
    },
  };

  target.dispatchEvent(
    new CustomEvent("yt-navigate", {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
}

export function handleYouTubeSpaLinkClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  options: YtNavigateOptions,
): void {
  if (event.defaultPrevented) return;
  if (isModifiedClick(event)) return;
  event.preventDefault();
  navigateYouTubeSpa(options);
}
