import type {
  ContextMenuConfig,
  ContextMenuInstance,
  MenuItem,
  MenuItemAction,
  MenuItemSubmenu,
  MenuClickEvent,
} from "./types.js";

const ROOT_CLASS = "cm-menu";
const ROOT_OPEN_CLASS = "cm-open";
const ROOT_LEAVE_CLASS = "cm-leave";
const SUBMENU_OPEN_CLASS = "cm-submenu-open";
const SUBMENU_HOVER_DELAY_MS = 200;

function getPortal(portal: ContextMenuConfig["portal"]): HTMLElement {
  if (portal == null) return document.body;
  return typeof portal === "function" ? portal() : portal;
}

function normalizeItem(raw: MenuItem): MenuItem {
  const item = { ...raw } as MenuItem;
  if ("visible" in item && item.visible === undefined) (item as MenuItemAction).visible = true;
  if ("type" in item && !("type" in item && item.type)) {
    if ("children" in item) (item as unknown as MenuItemSubmenu).type = "submenu";
    else if ("label" in item) (item as MenuItemAction).type = "item";
  }
  if ("children" in item && item.type === "submenu") {
    (item as MenuItemSubmenu).children = (item as MenuItemSubmenu).children.map(normalizeItem);
  }
  return item;
}

function positionMenu(
  el: HTMLElement,
  x: number,
  y: number,
  config: ContextMenuConfig
): void {
  const pos = config.position ?? {};
  const offsetX = pos.offset?.x ?? 0;
  const offsetY = pos.offset?.y ?? 0;
  const padding = pos.padding ?? 8;
  const flip = pos.flip !== false;
  const shift = pos.shift !== false;

  el.style.display = "";
  el.getClientRects();
  const rect = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  let left = x + offsetX;
  let top = y + offsetY;

  if (flip) {
    if (top + rect.height > vh - padding) top = y - rect.height - offsetY;
    if (left + rect.width > vw - padding) left = x - rect.width - offsetX;
    if (left < padding) left = padding;
    if (top < padding) top = padding;
  }
  if (shift) {
    left = Math.max(padding, Math.min(vw - rect.width - padding, left));
    top = Math.max(padding, Math.min(vh - rect.height - padding, top));
  }

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function applyAnimationConfig(
  root: HTMLElement,
  config: ContextMenuConfig
): void {
  const anim = config.animation;
  if (!anim || anim.disabled) return;
  const enter = anim.enter ?? 120;
  const leave = anim.leave ?? 80;
  const enterMs = typeof enter === "number" ? enter : enter.duration;
  const leaveMs = typeof leave === "number" ? leave : leave.duration;
  const enterEasing = typeof enter === "number" ? "ease-out" : enter.easing;
  const leaveEasing = typeof leave === "number" ? "ease-in" : leave.easing;
  root.style.setProperty("--cm-enter-duration", `${enterMs}ms`);
  root.style.setProperty("--cm-leave-duration", `${leaveMs}ms`);
  root.style.setProperty("--cm-enter-easing", enterEasing);
  root.style.setProperty("--cm-leave-easing", leaveEasing);
}

function appendIcon(el: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = "cm-icon";
  if (typeof icon === "string") {
    wrap.textContent = icon;
  } else {
    wrap.appendChild(icon);
  }
  el.appendChild(wrap);
}

const SUBMENU_CLOSE_DELAY_MS = 150;

function createItemNode(
  item: MenuItem,
  close: () => void,
  triggerSubmenu: (item: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuOpen?: (sub: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuClose?: (triggerEl: HTMLElement) => void,
  onHoverFocus?: (el: HTMLElement) => void
): HTMLElement | null {
  if ("visible" in item && item.visible === false) return null;

  if (item.type === "separator") {
    const el = document.createElement("div");
    el.setAttribute("role", "separator");
    el.className = "cm-separator";
    if (item.className) el.classList.add(item.className);
    return el;
  }

  if (item.type === "submenu") {
    const sub = item as MenuItemSubmenu;
    const el = document.createElement("div");
    (el as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu = sub;
    el.setAttribute("role", "menuitem");
    el.setAttribute("aria-haspopup", "menu");
    el.setAttribute("aria-expanded", "false");
    el.setAttribute("tabindex", "-1");
    el.className = "cm-item cm-submenu-trigger";
    if (sub.className) el.classList.add(sub.className);
    if (sub.id) el.id = sub.id;
    if (sub.disabled) el.setAttribute("aria-disabled", "true");

    const label = document.createElement("span");
    label.className = "cm-label";
    label.textContent = sub.label;
    el.appendChild(label);
    if (sub.icon) appendIcon(el, sub.icon);
    if (sub.shortcut) {
      const sc = document.createElement("span");
      sc.setAttribute("aria-hidden", "true");
      sc.className = "cm-shortcut";
      sc.textContent = sub.shortcut;
      el.appendChild(sc);
    }

    el.addEventListener("mouseenter", () => {
      onHoverFocus?.(el);
      if (sub.disabled) return;
      if (scheduleSubmenuOpen) scheduleSubmenuOpen(sub, el);
      else triggerSubmenu(sub, el);
    });
    el.addEventListener("mouseleave", () => {
      if (scheduleSubmenuClose) scheduleSubmenuClose(el);
    });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (sub.disabled) return;
      triggerSubmenu(sub, el);
    });
    return el;
  }

  const action = item as MenuItemAction;
  let el: HTMLElement;
  if (action.render) {
    el = action.render(action);
  } else {
    el = document.createElement("div");
    el.className = "cm-item";
    if (action.className) el.classList.add(action.className);
    const label = document.createElement("span");
    label.className = "cm-label";
    label.textContent = action.label;
    el.appendChild(label);
    if (action.icon) appendIcon(el, action.icon);
    if (action.shortcut) {
      const sc = document.createElement("span");
      sc.setAttribute("aria-hidden", "true");
      sc.className = "cm-shortcut";
      sc.textContent = action.shortcut;
      el.appendChild(sc);
    }
  }
  el.setAttribute("role", "menuitem");
  el.setAttribute("tabindex", "-1");
  if (action.id) el.id = action.id;
  if (action.disabled) el.setAttribute("aria-disabled", "true");

  el.addEventListener("mouseenter", () => {
    onHoverFocus?.(el);
  });
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (action.disabled || !action.onClick) return;
    const event: MenuClickEvent = {
      item: action,
      nativeEvent: e,
      close,
    };
    action.onClick(event);
  });
  return el;
}

function getFocusableItems(menuEl: HTMLElement): HTMLElement[] {
  return Array.from(
    menuEl.querySelectorAll<HTMLElement>("[role='menuitem']:not([aria-disabled='true'])")
  );
}

function setRovingTabindex(items: HTMLElement[], focusedIndex: number): void {
  items.forEach((node, i) => {
    node.setAttribute("tabindex", i === focusedIndex ? "0" : "-1");
  });
  if (items[focusedIndex]) items[focusedIndex].focus();
}

function makeHoverFocusHandler(menuEl: HTMLElement): (el: HTMLElement) => void {
  return (el: HTMLElement) => {
    const items = getFocusableItems(menuEl);
    const idx = items.indexOf(el);
    if (idx >= 0) setRovingTabindex(items, idx);
  };
}

export function createContextMenu(config: ContextMenuConfig): ContextMenuInstance {
  let menu: MenuItem[] = (config.menu ?? []).map(normalizeItem);
  const portal = getPortal(config.portal);
  const wrapper = document.createElement("div");
  wrapper.className = "cm-wrapper";
  wrapper.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999";
  const root = document.createElement("div");
  root.setAttribute("role", "menu");
  root.setAttribute("aria-orientation", "vertical");
  root.setAttribute("tabindex", "-1");
  root.className = ROOT_CLASS;
  root.style.cssText =
    "position:fixed;display:none;pointer-events:auto;min-width:8rem;outline:none;";

  if (config.theme?.class) root.classList.add(config.theme.class);
  if (config.theme?.tokens) {
    for (const [key, value] of Object.entries(config.theme.tokens)) {
      root.style.setProperty(key.startsWith("--") ? key : `--cm-${key}`, value);
    }
  }
  applyAnimationConfig(root, config);
  wrapper.appendChild(root);

  let isOpen = false;
  let lastFocusTarget: HTMLElement | null = null;
  let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let leaveTransitionHandler: (() => void) | null = null;
  let openSubmenu: { panel: HTMLElement; trigger: HTMLElement } | null = null;
  let submenuHoverTimer: ReturnType<typeof setTimeout> | null = null;
  let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  function cancelLeaveAnimation(): void {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      leaveTimeout = null;
    }
    if (leaveTransitionHandler) {
      root.removeEventListener("transitionend", leaveTransitionHandler);
      leaveTransitionHandler = null;
    }
    root.classList.remove(ROOT_LEAVE_CLASS);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    if (outsideClickHandler) {
      document.removeEventListener("mousedown", outsideClickHandler, true);
      outsideClickHandler = null;
    }
    cancelLeaveAnimation();
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = null;

    function doRootClose(): void {
      const anim = config.animation;
      const rawLeave = anim?.leave ?? 80;
      const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);

      if (leaveMs > 0 && !anim?.disabled) {
        root.classList.remove(ROOT_OPEN_CLASS);
        root.classList.add(ROOT_LEAVE_CLASS);
        const onEnd = (): void => {
          if (leaveTimeout) clearTimeout(leaveTimeout);
          leaveTimeout = null;
          if (leaveTransitionHandler) {
            root.removeEventListener("transitionend", leaveTransitionHandler);
            leaveTransitionHandler = null;
          }
          root.classList.remove(ROOT_LEAVE_CLASS);
          root.style.display = "none";
          wrapper.remove();
          config.onClose?.();
          if (lastFocusTarget && typeof lastFocusTarget.focus === "function") lastFocusTarget.focus();
        };
        leaveTransitionHandler = onEnd;
        root.addEventListener("transitionend", onEnd, { once: true });
        leaveTimeout = setTimeout(onEnd, leaveMs + 50);
      } else {
        root.style.display = "none";
        wrapper.remove();
        config.onClose?.();
        if (lastFocusTarget && typeof lastFocusTarget.focus === "function") lastFocusTarget.focus();
      }
    }

    if (openSubmenu) {
      const { panel, trigger } = openSubmenu;
      openSubmenu = null;
      closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: false, onDone: doRootClose });
      return;
    }
    doRootClose();
  }

  function closeSubmenuWithAnimation(
    panel: HTMLElement,
    trigger: HTMLElement,
    options: { clearOpenSubmenu?: boolean; onDone?: () => void } = {}
  ): void {
    const { clearOpenSubmenu = true, onDone } = options;
    const anim = config.animation;
    const rawLeave = anim?.leave ?? 80;
    const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);

    const finish = (): void => {
      panel.remove();
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove(SUBMENU_OPEN_CLASS);
      if (clearOpenSubmenu) openSubmenu = null;
      onDone?.();
    };

    if (leaveMs <= 0 || anim?.disabled) {
      finish();
      return;
    }

    panel.classList.remove(ROOT_OPEN_CLASS);
    panel.classList.add(ROOT_LEAVE_CLASS);
    let done = false;
    const onEnd = (): void => {
      if (done) return;
      done = true;
      panel.removeEventListener("transitionend", onEnd);
      if (t) clearTimeout(t);
      finish();
    };
    panel.addEventListener("transitionend", onEnd, { once: true });
    const t = setTimeout(onEnd, leaveMs + 50);
  }

  function openSubmenuPanel(sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
    if (openSubmenu) {
      const prev = openSubmenu;
      openSubmenu = null;
      closeSubmenuWithAnimation(prev.panel, prev.trigger, { clearOpenSubmenu: false });
    }
    const panel = document.createElement("div");
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", sub.label);
    panel.setAttribute("aria-orientation", "vertical");
    panel.setAttribute("tabindex", "-1");
    panel.className = `${ROOT_CLASS} cm-submenu`;
    panel.style.cssText = "position:fixed;min-width:8rem;outline:none;pointer-events:auto;";
    panel.addEventListener("mouseenter", cancelSubmenuClose);
    if (config.theme?.class) panel.classList.add(config.theme.class);
    if (config.theme?.tokens) {
      for (const [key, value] of Object.entries(config.theme.tokens)) {
        panel.style.setProperty(key.startsWith("--") ? key : `--cm-${key}`, value);
      }
    }
    applyAnimationConfig(panel, config);

    sub.children.forEach((child) => {
      const node = createItemNode(child, close, (subItem, el) => openSubmenuPanel(subItem as MenuItemSubmenu, el), scheduleSubmenuOpen, scheduleSubmenuClose, makeHoverFocusHandler(panel));
      if (node) panel.appendChild(node);
    });

    wrapper.appendChild(panel);
    const triggerRect = triggerEl.getBoundingClientRect();
    const padding = config.position?.padding ?? 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let left = triggerRect.right + 2;
    let top = triggerRect.top;
    panel.style.display = "";
    panel.getClientRects();
    const rect = panel.getBoundingClientRect();
    if (left + rect.width > vw - padding) left = triggerRect.left - rect.width - 2;
    if (top + rect.height > vh - padding) top = vh - rect.height - padding;
    if (top < padding) top = padding;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    triggerEl.setAttribute("aria-expanded", "true");
    triggerEl.classList.add(SUBMENU_OPEN_CLASS);
    openSubmenu = { panel, trigger: triggerEl };

    requestAnimationFrame(() => {
      panel.classList.add(ROOT_OPEN_CLASS);
    });
  }

  function scheduleSubmenuOpen(sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
    if (openSubmenu && openSubmenu.trigger === triggerEl) {
      triggerEl.focus();
      return;
    }
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = setTimeout(() => {
      submenuHoverTimer = null;
      if (openSubmenu && openSubmenu.trigger === triggerEl) return;
      openSubmenuPanel(sub, triggerEl);
    }, SUBMENU_HOVER_DELAY_MS);
  }

  function scheduleSubmenuClose(triggerEl: HTMLElement): void {
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = setTimeout(() => {
      submenuHoverTimer = null;
      if (openSubmenu && openSubmenu.trigger === triggerEl) {
        const { panel, trigger } = openSubmenu;
        openSubmenu = null;
        closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: false });
      }
    }, SUBMENU_CLOSE_DELAY_MS);
  }

  function cancelSubmenuClose(): void {
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = null;
  }

  function triggerSubmenu(sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
    openSubmenuPanel(sub, triggerEl);
  }

  function buildRootContent(): void {
    root.innerHTML = "";
    menu.forEach((item) => {
      const node = createItemNode(item, close, triggerSubmenu, scheduleSubmenuOpen, scheduleSubmenuClose, makeHoverFocusHandler(root));
      if (node) root.appendChild(node);
    });
  }

  function open(xOrEvent?: number | MouseEvent, y?: number): void {
    let x: number;
    let yCoord: number;
    if (typeof xOrEvent === "object" && xOrEvent !== null) {
      x = xOrEvent.clientX;
      yCoord = xOrEvent.clientY;
    } else {
      x = xOrEvent ?? 0;
      yCoord = y ?? 0;
    }
    cancelLeaveAnimation();
    if (isOpen) close();
    lastFocusTarget = document.activeElement as HTMLElement | null;
    isOpen = true;
    buildRootContent();
    if (!wrapper.parentElement) portal.appendChild(wrapper);
    outsideClickHandler = (e: MouseEvent): void => {
      if (!wrapper.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", outsideClickHandler, true);
    positionMenu(root, x, yCoord, config);
    root.style.display = "";

    const anim = config.animation;
    if (anim?.disabled) {
      root.classList.add(ROOT_OPEN_CLASS);
      config.onOpen?.();
      const items = getFocusableItems(root);
      if (items.length) setRovingTabindex(items, 0);
      return;
    }
    root.getClientRects();
    requestAnimationFrame(() => {
      root.classList.add(ROOT_OPEN_CLASS);
      config.onOpen?.();
      const items = getFocusableItems(root);
      if (items.length) setRovingTabindex(items, 0);
    });
  }

  function handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const menuEl = target.closest("[role='menu']") as HTMLElement;
    if (!menuEl) return;
    const isSub = menuEl.classList.contains("cm-submenu");
    const items = getFocusableItems(menuEl);
    let idx = items.indexOf(target);
    if (idx === -1) {
      if (e.key === "ArrowDown" && items.length) {
        e.preventDefault();
        setRovingTabindex(items, 0);
      } else if (e.key === "ArrowUp" && items.length) {
        e.preventDefault();
        setRovingTabindex(items, items.length - 1);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = (idx + 1) % items.length;
        setRovingTabindex(items, next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = idx === 0 ? items.length - 1 : idx - 1;
        setRovingTabindex(items, prev);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        const sub = (target as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
        if (sub) openSubmenuPanel(sub, target);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (isSub && openSubmenu) {
          const { panel, trigger } = openSubmenu;
          openSubmenu = null;
          closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: false, onDone: () => trigger.focus() });
        } else {
          close();
        }
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        const sub = (target as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
        if (sub) openSubmenuPanel(sub, target);
        else target.click();
        break;
      }
      case "Escape": {
        e.preventDefault();
        if (isSub && openSubmenu) {
          const { panel, trigger } = openSubmenu;
          openSubmenu = null;
          closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: false, onDone: () => trigger.focus() });
        } else {
          close();
        }
        break;
      }
      case "Home": {
        e.preventDefault();
        setRovingTabindex(items, 0);
        break;
      }
      case "End": {
        e.preventDefault();
        setRovingTabindex(items, items.length - 1);
        break;
      }
      default:
        break;
    }
  }

  wrapper.addEventListener("keydown", handleKeydown);

  function destroy(): void {
    if (outsideClickHandler) {
      document.removeEventListener("mousedown", outsideClickHandler, true);
      outsideClickHandler = null;
    }
    if (leaveTimeout) clearTimeout(leaveTimeout);
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    wrapper.remove();
    wrapper.removeEventListener("keydown", handleKeydown);
  }

  function setMenu(newMenu: MenuItem[]): void {
    menu = newMenu.map(normalizeItem);
  }

  const instance: ContextMenuInstance = {
    open,
    close,
    toggle(x?: number, y?: number) {
      if (isOpen) close();
      else open(x ?? 0, y ?? 0);
    },
    destroy,
    setMenu,
  };
  return instance;
}
