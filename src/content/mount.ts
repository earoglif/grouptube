type ShadowMountOptions = {
  host: HTMLElement;
  styleId: string;
  rootId: string;
  styles: string;
};

export function ensureShadowMount(options: ShadowMountOptions): HTMLElement {
  const { host, styleId, rootId, styles } = options;
  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });

  let styleElement = shadowRoot.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = styles;
    shadowRoot.append(styleElement);
  }

  let mountRoot = shadowRoot.getElementById(rootId);
  if (!mountRoot) {
    mountRoot = document.createElement("div");
    mountRoot.id = rootId;
    shadowRoot.append(mountRoot);
  }

  return mountRoot;
}
