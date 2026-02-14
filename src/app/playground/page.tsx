"use client";

import { useEffect, useRef, useState } from "react";
import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";
import {
  defaultPlaygroundState,
  getPresetState,
  PRESET_LABELS,
  type PlaygroundState,
  type EditableMenuItem,
  type EditableAction,
  type EditableLink,
  type EditableCheckbox,
  type EditableRadio,
  type EditableSubmenu,
  type PlaygroundPresetKey,
  generateId,
  findMenuItem,
  updateMenuItem,
} from "@/lib/playground-state";
import { buildMenuFromEditable, type PlaygroundMenuCallbacks } from "@/lib/playground-build-menu";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function PlaygroundPage() {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState<PlaygroundState>(() => defaultPlaygroundState());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedSubmenuId, setDraggedSubmenuId] = useState<string | null>(null);
  const [draggedSubmenuIndex, setDraggedSubmenuIndex] = useState<number | null>(null);
  const sandboxRef = useRef<HTMLDivElement>(null);
  const openAtButtonRef = useRef<HTMLButtonElement>(null);
  const menuInstanceRef = useRef<ReturnType<typeof createContextMenu> | null>(null);
  const scrollLockHandlerRef = useRef<((e: Event) => void) | null>(null);

  const selectedItem = selectedItemId ? findMenuItem(state?.menuItems, selectedItemId) : null;

  const updateItem = (id: string, partial: Partial<EditableMenuItem>) => {
    setState((s) => ({
      ...s,
      menuItems: updateMenuItem(s.menuItems, id, (it) => ({ ...it, ...partial } as EditableMenuItem)),
    }));
  };

  const setRadioGroup = (selectedId: string, name: string, _value: string) => {
    setState((s) => {
      const setRadioChecked = (items: EditableMenuItem[] | undefined): EditableMenuItem[] =>
        (items ?? []).map((it) => {
          if (it.type === "radio" && it.name === name)
            return { ...it, checked: it.id === selectedId };
          if (it.type === "submenu" && "children" in it)
            return { ...it, children: setRadioChecked(it.children) };
          return it;
        });
      return { ...s, menuItems: setRadioChecked(s.menuItems) };
    });
  };

  const menuCallbacks: PlaygroundMenuCallbacks = {
    onCheckboxChange: (id, checked) => updateItem(id, { checked }),
    onRadioSelect: (id, name, value) => setRadioGroup(id, name, value),
  };

  const menu = buildMenuFromEditable(state?.menuItems, menuCallbacks);

  useEffect(() => {
    const sandboxEl = sandboxRef.current;
    if (!sandboxEl) return;

    const themeConfig =
      state.theme.preset === "dark"
        ? { class: "cm-theme-dark" }
        : state.theme.preset === "auto"
          ? resolvedTheme === "dark"
            ? { class: "cm-theme-dark" }
            : undefined
          : state.theme.preset === "custom" && state.theme.tokens
            ? { class: state.theme.class, tokens: state.theme.tokens }
            : undefined;

    const animationConfig = state.animation.disabled
      ? { disabled: true }
      : {
          type: state.animation.type,
          enter:
            state.animation.enterDuration > 0
              ? {
                  duration: state.animation.enterDuration,
                  easing: state.animation.enterEasing,
                }
              : undefined,
          leave:
            state.animation.leaveDuration > 0
              ? {
                  duration: state.animation.leaveDuration,
                  easing: state.animation.leaveEasing,
                }
              : undefined,
        };

    const positionConfig = {
      offset: { x: state.position.offsetX, y: state.position.offsetY },
      padding: state.position.padding,
      flip: state.position.flip,
      shift: state.position.shift,
    };

    const submenuArrowConfig =
      state.submenu.arrow && (state.submenu.arrowSize !== undefined || state.submenu.arrowOpacity !== undefined)
        ? {
            size: state.submenu.arrowSize,
            opacity: state.submenu.arrowOpacity,
          }
        : state.submenu.arrow;

    const scrollOpts: AddEventListenerOptions = { passive: false, capture: true };

    const contextMenu = createContextMenu({
      menu,
      theme: themeConfig,
      animation: animationConfig,
      position: positionConfig,
      submenuArrow: submenuArrowConfig,
      submenuPlacement: state.submenu.placement,
      platform: state.platform,
      closeOnResize: state.behavior.closeOnResize,
      bind: { element: sandboxEl, options: { longPressMs: state.behavior.longPressMs } },
      onOpen: () => {
        const removeScrollLock = () => {
          const prev = scrollLockHandlerRef.current;
          if (!prev) return;
          document.removeEventListener("wheel", prev, scrollOpts);
          document.removeEventListener("touchmove", prev, scrollOpts);
          scrollLockHandlerRef.current = null;
        };
        removeScrollLock();
        if (!state.behavior.lockScrollOutside) return;
        const root = contextMenu.getRootElement();
        const handler = (e: Event) => {
          const target = e.target instanceof Node ? e.target : null;
          if (target && root.contains(target)) return;
          e.preventDefault();
        };
        scrollLockHandlerRef.current = handler;
        document.addEventListener("wheel", handler, scrollOpts);
        document.addEventListener("touchmove", handler, scrollOpts);
      },
      onClose: () => {
        const handler = scrollLockHandlerRef.current;
        if (!handler) return;
        document.removeEventListener("wheel", handler, scrollOpts);
        document.removeEventListener("touchmove", handler, scrollOpts);
        scrollLockHandlerRef.current = null;
      },
    });

    menuInstanceRef.current = contextMenu;

    const openAtBtn = openAtButtonRef.current;
    if (state.useOpenAtElementButton && openAtBtn) {
      openAtBtn.onclick = () => {
        contextMenu.openAtElement(openAtBtn, { placement: "bottom-start" });
      };
    }

    return () => {
      const handler = scrollLockHandlerRef.current;
      if (handler) {
        document.removeEventListener("wheel", handler, scrollOpts);
        document.removeEventListener("touchmove", handler, scrollOpts);
        scrollLockHandlerRef.current = null;
      }
      menuInstanceRef.current = null;
      contextMenu.destroy();
    };
  }, [
    state.menuItems,
    state.theme,
    state.animation,
    state.position,
    state.submenu,
    state.platform,
    state.behavior,
    state.useOpenAtElementButton,
    resolvedTheme,
  ]);

  const updateItems = (updater: (prev: EditableMenuItem[]) => EditableMenuItem[]) => {
    setState((s) => ({ ...s, menuItems: updater(s.menuItems ?? []) }));
  };

  const addItem = (type: EditableMenuItem["type"]) => {
    const id = generateId();
    if (type === "separator") {
      updateItems((prev) => [...prev, { id, type: "separator" }]);
    } else if (type === "label") {
      updateItems((prev) => [...prev, { id, type: "label", label: "Label" }]);
    } else if (type === "item") {
      updateItems((prev) => [...prev, { id, type: "item", label: "New item" }]);
    } else if (type === "link") {
      updateItems((prev) => [...prev, { id, type: "link", label: "Link", href: "https://example.com" }]);
    } else if (type === "checkbox") {
      updateItems((prev) => [...prev, { id, type: "checkbox", label: "Option", checked: false }]);
    } else if (type === "radio") {
      updateItems((prev) => [...prev, { id, type: "radio", label: "Option", name: "grp", value: "opt", checked: false }]);
    } else if (type === "submenu") {
      updateItems((prev) => [
        ...prev,
        { id, type: "submenu", label: "Submenu", children: [{ id: generateId(), type: "item", label: "Child" }] },
      ]);
    }
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setState((s) => {
      const next = (s.menuItems ?? []).slice();
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return { ...s, menuItems: next };
    });
  };

  const removeItem = (id: string) => {
    const remove = (items: EditableMenuItem[] | undefined): EditableMenuItem[] =>
      (items ?? []).flatMap((it): EditableMenuItem[] => {
        if (it.id === id) return [];
        if (it.type === "submenu" && "children" in it)
          return [{ ...it, children: remove(it.children) } as EditableSubmenu];
        return [it];
      });
    updateItems(remove);
  };

  const addItemToSubmenu = (submenuId: string, type: EditableMenuItem["type"]) => {
    const id = generateId();
    const newChild: EditableMenuItem =
      type === "separator"
        ? { id, type: "separator" }
        : type === "label"
          ? { id, type: "label", label: "Label" }
          : type === "item"
            ? { id, type: "item", label: "New item" }
            : type === "link"
              ? { id, type: "link", label: "Link", href: "https://example.com" }
              : type === "checkbox"
                ? { id, type: "checkbox", label: "Option", checked: false }
                : type === "radio"
                  ? { id, type: "radio", label: "Option", name: "grp", value: "opt", checked: false }
                  : {
                      id,
                      type: "submenu",
                      label: "Submenu",
                      children: [{ id: generateId(), type: "item", label: "Child" }],
                    };
    setState((s) => ({
      ...s,
      menuItems: updateMenuItem(s.menuItems, submenuId, (it) => {
        if (it.type !== "submenu") return it;
        return { ...it, children: [...(it.children ?? []), newChild] } as EditableSubmenu;
      }),
    }));
  };

  const reorderSubmenuChildren = (submenuId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setState((s) => ({
      ...s,
      menuItems: updateMenuItem(s.menuItems, submenuId, (it) => {
        if (it.type !== "submenu") return it;
        const next = (it.children ?? []).slice();
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        return { ...it, children: next } as EditableSubmenu;
      }),
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-muted/30 to-chart-1/10 dark:from-background dark:via-muted/20 dark:to-chart-2/10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-30" aria-hidden />
      <div className="relative container mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-10 text-center md:text-left">
          <h1 className="bg-linear-to-r from-foreground via-foreground to-chart-1 dark:to-chart-2 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
            Playground
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground md:mt-2">
            Try every feature of contextmenu.js. Right-click or long-press the sandbox; tweak items, theme, animation, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
          <aside className="space-y-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1">
            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Presets
                </CardTitle>
                <p className="text-xs text-muted-foreground">Load a scenario to explore features.</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium shadow-sm"
                  onClick={() => setState(defaultPlaygroundState())}
                >
                  Reset
                </Button>
                {(Object.keys(PRESET_LABELS) as PlaygroundPresetKey[]).map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-md"
                    onClick={() => setState((s) => ({ ...s, ...getPresetState(key) }))}
                  >
                    {PRESET_LABELS[key]}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Menu items
                </CardTitle>
                <p className="text-xs text-muted-foreground">Drag to reorder.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["item", "separator", "label", "link", "checkbox", "radio", "submenu"] as const).map((t) => (
                    <Button key={t} variant="outline" size="sm" onClick={() => addItem(t)}>
                      + {t}
                    </Button>
                  ))}
                </div>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                  {(state?.menuItems ?? []).map((it, index) => (
                    <li
                      key={it.id}
                      data-index={index}
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(index);
                        e.dataTransfer.setData("text/plain", String(index));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggedIndex(null);
                        const from = Number(e.dataTransfer.getData("text/plain"));
                        const to = Number((e.currentTarget as HTMLElement).dataset.index);
                        if (Number.isFinite(from) && Number.isFinite(to)) reorderItems(from, to);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className={cn(
                        "flex cursor-grab items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/50 active:cursor-grabbing",
                        selectedItemId === it.id && "bg-accent/50",
                        draggedIndex === index && "opacity-50"
                      )}
                      onClick={() => setSelectedItemId((current) => (current === it.id ? null : it.id))}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {it.type}
                        </span>
                        <span className="truncate text-foreground">
                          {it.type === "separator" ? "—" : "label" in it ? (it as { label: string }).label : "—"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(it.id);
                          if (selectedItemId === it.id) setSelectedItemId(null);
                        }}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
                {selectedItem && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Edit selected</p>
                    {selectedItem.type === "separator" && (
                      <div>
                        <label className="text-xs text-muted-foreground">ClassName</label>
                        <Input
                          className="mt-0.5 h-8 text-sm"
                          placeholder="Optional CSS class"
                          value={(selectedItem as { className?: string }).className ?? ""}
                          onChange={(e) =>
                            updateItem(selectedItem.id, { className: e.target.value || undefined })
                          }
                        />
                      </div>
                    )}
                    {"label" in selectedItem && (
                      <div>
                        <label className="text-xs text-muted-foreground">Label</label>
                        <Input
                          className="mt-0.5 h-8 text-sm"
                          value={selectedItem.label}
                          onChange={(e) => updateItem(selectedItem.id, { label: e.target.value })}
                        />
                      </div>
                    )}
                    {(selectedItem.type === "label") && (
                      <div>
                        <label className="text-xs text-muted-foreground">ClassName</label>
                        <Input
                          className="mt-0.5 h-8 text-sm"
                          placeholder="Optional CSS class"
                          value={(selectedItem as { className?: string }).className ?? ""}
                          onChange={(e) =>
                            updateItem(selectedItem.id, { className: e.target.value || undefined })
                          }
                        />
                      </div>
                    )}
                    {(selectedItem.type === "item" || selectedItem.type === "link" || selectedItem.type === "submenu") && (
                      <>
                        {"icon" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Icon</label>
                            <Input
                              className="mt-0.5 h-8 text-sm"
                              placeholder="e.g. lucide icon name or SVG"
                              value={"icon" in selectedItem ? (selectedItem.icon ?? "") : ""}
                              onChange={(e) => updateItem(selectedItem.id, { icon: e.target.value || undefined })}
                            />
                          </div>
                        )}
                        {"shortcut" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Shortcut</label>
                            <Input
                              className="mt-0.5 h-8 text-sm"
                              placeholder="e.g. Ctrl+C"
                              value={"shortcut" in selectedItem ? selectedItem.shortcut ?? "" : ""}
                              onChange={(e) => updateItem(selectedItem.id, { shortcut: e.target.value || undefined })}
                            />
                          </div>
                        )}
                        {"badge" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Badge</label>
                            <Input
                              className="mt-0.5 h-8 text-sm"
                              placeholder="e.g. 3 or New"
                              value={
                                typeof (selectedItem as { badge?: string | number | object }).badge === "object" &&
                                selectedItem.badge &&
                                "content" in (selectedItem.badge as object)
                                  ? String((selectedItem.badge as { content?: string | number }).content ?? "")
                                  : (selectedItem as { badge?: string | number }).badge !== undefined
                                    ? String((selectedItem as { badge?: string | number }).badge)
                                    : ""
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") updateItem(selectedItem.id, { badge: undefined });
                                else if (/^\d+$/.test(v)) updateItem(selectedItem.id, { badge: Number(v) });
                                else updateItem(selectedItem.id, { badge: v });
                              }}
                            />
                          </div>
                        )}
                        {"variant" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Variant</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(["default", "danger", "info", "success", "warning", "muted"] as const).map((v) => (
                                <Button
                                  key={v}
                                  variant={(selectedItem as { variant?: string }).variant === v ? "default" : "outline"}
                                  size="xs"
                                  onClick={() => updateItem(selectedItem.id, { variant: v })}
                                >
                                  {v}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedItem.type === "item" && (
                          <>
                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={!!(selectedItem as EditableAction).disabled}
                                onCheckedChange={(checked) => updateItem(selectedItem.id, { disabled: checked === true })}
                              />
                              Disabled
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={!!(selectedItem as EditableAction).visible}
                                onCheckedChange={(checked) =>
                                  updateItem(selectedItem.id, { visible: checked === true })
                                }
                              />
                              Visible
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={!!(selectedItem as EditableAction).loading}
                                onCheckedChange={(checked) => updateItem(selectedItem.id, { loading: checked === true })}
                              />
                              Loading
                            </label>
                            {(selectedItem as EditableAction).loading && (
                              <>
                                <div>
                                  <label className="text-xs text-muted-foreground">Loading size</label>
                                  <Input
                                    className="mt-0.5 h-8 text-sm"
                                    placeholder="e.g. 14 or 0.75rem"
                                    value={
                                      (selectedItem as EditableAction).loadingSize !== undefined
                                        ? String((selectedItem as EditableAction).loadingSize)
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === "")
                                        updateItem(selectedItem.id, { loadingSize: undefined });
                                      else if (/^\d+$/.test(v))
                                        updateItem(selectedItem.id, { loadingSize: Number(v) });
                                      else
                                        updateItem(selectedItem.id, { loadingSize: v });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Loading speed (ms)</label>
                                  <Input
                                    className="mt-0.5 h-8 text-sm"
                                    type="number"
                                    placeholder="600"
                                    value={
                                      (selectedItem as EditableAction).loadingSpeed !== undefined
                                        ? (selectedItem as EditableAction).loadingSpeed
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (v === "")
                                        updateItem(selectedItem.id, { loadingSpeed: undefined });
                                      else
                                        updateItem(selectedItem.id, { loadingSpeed: Number(e.target.value) });
                                    }}
                                  />
                                </div>
                              </>
                            )}
                            <label className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                checked={(selectedItem as EditableAction).closeOnAction !== false}
                                onCheckedChange={(checked) =>
                                  updateItem(selectedItem.id, { closeOnAction: checked === true })
                                }
                              />
                              Close on action
                            </label>
                          </>
                        )}
                        {(selectedItem.type === "link" || selectedItem.type === "submenu") && "disabled" in selectedItem && (
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={!!(selectedItem as EditableLink | EditableSubmenu).disabled}
                              onCheckedChange={(checked) =>
                                updateItem(selectedItem.id, { disabled: checked === true })
                              }
                            />
                            Disabled
                          </label>
                        )}
                        {selectedItem.type === "submenu" && (
                          <div>
                            <label className="text-xs text-muted-foreground">Submenu placement</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(["auto", "right", "left"] as const).map((p) => (
                                <Button
                                  key={p}
                                  variant={
                                    (selectedItem as EditableSubmenu).submenuPlacement === p ? "default" : "outline"
                                  }
                                  size="xs"
                                  onClick={() => updateItem(selectedItem.id, { submenuPlacement: p })}
                                >
                                  {p}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {selectedItem.type === "link" && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground">href</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            value={(selectedItem as EditableLink).href}
                            onChange={(e) => updateItem(selectedItem.id, { href: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Target</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="e.g. _blank"
                            value={(selectedItem as EditableLink).target ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { target: e.target.value || undefined })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Rel</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="e.g. noopener noreferrer"
                            value={(selectedItem as EditableLink).rel ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { rel: e.target.value || undefined })
                            }
                          />
                        </div>
                      </>
                    )}
                    {selectedItem.type === "checkbox" && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground">Shortcut</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="e.g. Ctrl+G"
                            value={(selectedItem as EditableCheckbox).shortcut ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { shortcut: e.target.value || undefined })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Leading icon</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="Optional"
                            value={(selectedItem as EditableCheckbox).leadingIcon ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { leadingIcon: e.target.value || undefined })
                            }
                          />
                        </div>
                        {"variant" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Variant</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(["default", "danger", "info", "success", "warning", "muted"] as const).map((v) => (
                                <Button
                                  key={v}
                                  variant={(selectedItem as EditableCheckbox).variant === v ? "default" : "outline"}
                                  size="xs"
                                  onClick={() => updateItem(selectedItem.id, { variant: v })}
                                >
                                  {v}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={(selectedItem as EditableCheckbox).checked}
                            onCheckedChange={(checked) => updateItem(selectedItem.id, { checked: checked === true })}
                          />
                          Checked
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={!!(selectedItem as EditableCheckbox).disabled}
                            onCheckedChange={(checked) =>
                              updateItem(selectedItem.id, { disabled: checked === true })
                            }
                          />
                          Disabled
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={(selectedItem as EditableCheckbox).closeOnAction !== false}
                            onCheckedChange={(checked) =>
                              updateItem(selectedItem.id, { closeOnAction: checked === true })
                            }
                          />
                          Close on action
                        </label>
                      </>
                    )}
                    {selectedItem.type === "radio" && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="Radio group name"
                            value={(selectedItem as EditableRadio).name}
                            onChange={(e) => updateItem(selectedItem.id, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Value</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="Value when selected"
                            value={(selectedItem as EditableRadio).value}
                            onChange={(e) => updateItem(selectedItem.id, { value: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Shortcut</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="e.g. Ctrl+R"
                            value={(selectedItem as EditableRadio).shortcut ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { shortcut: e.target.value || undefined })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Leading icon</label>
                          <Input
                            className="mt-0.5 h-8 text-sm"
                            placeholder="Optional"
                            value={(selectedItem as EditableRadio).leadingIcon ?? ""}
                            onChange={(e) =>
                              updateItem(selectedItem.id, { leadingIcon: e.target.value || undefined })
                            }
                          />
                        </div>
                        {"variant" in selectedItem && (
                          <div>
                            <label className="text-xs text-muted-foreground">Variant</label>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(["default", "danger", "info", "success", "warning", "muted"] as const).map((v) => (
                                <Button
                                  key={v}
                                  variant={(selectedItem as EditableRadio).variant === v ? "default" : "outline"}
                                  size="xs"
                                  onClick={() => updateItem(selectedItem.id, { variant: v })}
                                >
                                  {v}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={(selectedItem as EditableRadio).checked}
                            onCheckedChange={(checked) => updateItem(selectedItem.id, { checked: checked === true })}
                          />
                          Checked
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={!!(selectedItem as EditableRadio).disabled}
                            onCheckedChange={(checked) =>
                              updateItem(selectedItem.id, { disabled: checked === true })
                            }
                          />
                          Disabled
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={(selectedItem as EditableRadio).closeOnAction !== false}
                            onCheckedChange={(checked) =>
                              updateItem(selectedItem.id, { closeOnAction: checked === true })
                            }
                          />
                          Close on action
                        </label>
                      </>
                    )}
                    {selectedItem.type === "submenu" && (
                      <>
                        <div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={!!(selectedItem as EditableSubmenu).lazy}
                              onCheckedChange={(checked) => updateItem(selectedItem.id, { lazy: checked === true })}
                            />
                            Lazy children
                          </label>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Submenu items load after 0.5s (simulated async).
                          </p>
                        </div>
                        <div className="border-t pt-3">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Submenu children</p>
                          <div className="mb-2 flex flex-wrap gap-1">
                            {(["item", "separator", "label", "link", "checkbox", "radio", "submenu"] as const).map(
                              (t) => (
                                <Button
                                  key={t}
                                  variant="outline"
                                  size="xs"
                                  onClick={() => addItemToSubmenu(selectedItem.id, t)}
                                >
                                  + {t}
                                </Button>
                              )
                            )}
                          </div>
                          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                            {((selectedItem as EditableSubmenu)?.children ?? []).map((child, index) => (
                              <li
                                key={child.id}
                                data-index={index}
                                data-submenu-id={selectedItem.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedSubmenuId(selectedItem.id);
                                  setDraggedSubmenuIndex(index);
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({ submenuId: selectedItem.id, index })
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDraggedSubmenuId(null);
                                  setDraggedSubmenuIndex(null);
                                  try {
                                    const { submenuId, index: from } = JSON.parse(
                                      e.dataTransfer.getData("application/json")
                                    ) as { submenuId: string; index: number };
                                    const to = Number((e.currentTarget as HTMLElement).dataset.index);
                                    if (submenuId === selectedItem.id && Number.isFinite(from) && Number.isFinite(to))
                                      reorderSubmenuChildren(submenuId, from, to);
                                  } catch {
                                    // ignore
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggedSubmenuId(null);
                                  setDraggedSubmenuIndex(null);
                                }}
                                className={cn(
                                  "flex cursor-grab items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/50 active:cursor-grabbing",
                                  selectedItemId === child.id && "bg-accent/50",
                                  draggedSubmenuId === selectedItem.id && draggedSubmenuIndex === index && "opacity-50"
                                )}
                                onClick={() =>
                                  setSelectedItemId((current) => (current === child.id ? null : child.id))
                                }
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {child.type}
                                  </span>
                                  <span className="truncate text-foreground">
                                    {child.type === "separator"
                                      ? "—"
                                      : "label" in child
                                        ? (child as { label: string }).label
                                        : "—"}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(child.id);
                                    if (selectedItemId === child.id) setSelectedItemId(null);
                                  }}
                                >
                                  ×
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {(["auto", "dark", "custom"] as const).map((preset) => (
                    <Button
                      key={preset}
                      variant={state.theme.preset === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setState((s) => ({ ...s, theme: { ...s.theme, preset } }))}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
                {state.theme.preset === "auto" && (
                  <p className="text-xs text-muted-foreground">
                    Follows page theme (light/dark).
                  </p>
                )}
                {state.theme.preset === "custom" && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(["bg", "fg", "radius"] as const).map((key) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground">{key}</label>
                        <Input
                          className="mt-0.5 h-8"
                          placeholder={key === "radius" ? "12px" : key === "bg" ? "#fff" : "#1a1a1a"}
                          value={state.theme.tokens?.[key] ?? ""}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              theme: {
                                ...s.theme,
                                tokens: { ...s.theme.tokens, [key]: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Animation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {(["fade", "slide"] as const).map((t) => (
                    <Button
                      key={t}
                      variant={state.animation.type === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setState((s) => ({ ...s, animation: { ...s.animation, type: t } }))}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Enter (ms)</label>
                    <Input
                      type="number"
                      className="mt-0.5 h-8"
                      value={state.animation.enterDuration}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          animation: { ...s.animation, enterDuration: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Leave (ms)</label>
                    <Input
                      type="number"
                      className="mt-0.5 h-8"
                      value={state.animation.leaveDuration}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          animation: { ...s.animation, leaveDuration: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.animation.disabled}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, animation: { ...s.animation, disabled: checked === true } }))
                    }
                  />
                  Disabled
                </label>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Position
                </CardTitle>
                <p className="text-xs text-muted-foreground">Offset and padding (px)</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Offset X</label>
                    <Input
                      type="number"
                      className="mt-0.5 h-8"
                      value={state.position.offsetX}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          position: { ...s.position, offsetX: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Offset Y</label>
                    <Input
                      type="number"
                      className="mt-0.5 h-8"
                      value={state.position.offsetY}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          position: { ...s.position, offsetY: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Padding</label>
                    <Input
                      type="number"
                      className="mt-0.5 h-8"
                      value={state.position.padding}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          position: { ...s.position, padding: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.position.flip}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, position: { ...s.position, flip: checked === true } }))
                    }
                  />
                  Flip
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.position.shift}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, position: { ...s.position, shift: checked === true } }))
                    }
                  />
                  Shift
                </label>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Submenu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Placement</label>
                  <div className="mt-1 flex gap-2">
                    {(["auto", "right", "left"] as const).map((p) => (
                      <Button
                        key={p}
                        variant={state.submenu.placement === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setState((s) => ({ ...s, submenu: { ...s.submenu, placement: p } }))}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.submenu.arrow}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, submenu: { ...s.submenu, arrow: checked === true } }))
                    }
                  />
                  Arrow
                </label>
                {state.submenu.arrow && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground">Arrow size</label>
                      <Input
                        type="number"
                        className="mt-0.5 h-8"
                        value={state.submenu.arrowSize ?? 5}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            submenu: { ...s.submenu, arrowSize: Number(e.target.value) || 5 },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Arrow opacity</label>
                      <Input
                        type="number"
                        className="mt-0.5 h-8"
                        min={0}
                        max={1}
                        step={0.1}
                        value={state.submenu.arrowOpacity ?? 0.7}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            submenu: { ...s.submenu, arrowOpacity: Number(e.target.value) || 0.7 },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {(["auto", "mac", "win"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={state.platform === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setState((s) => ({ ...s, platform: p }))}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/80 bg-card/95 shadow-lg shadow-black/5 dark:shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.behavior.lockScrollOutside}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, behavior: { ...s.behavior, lockScrollOutside: checked === true } }))
                    }
                  />
                  Lock scroll outside
                </label>
                <p className="text-xs text-muted-foreground">
                  Prevent page scroll while the menu is open (wheel and touch).
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.useOpenAtElementButton}
                    onCheckedChange={(checked) => setState((s) => ({ ...s, useOpenAtElementButton: checked === true }))}
                  />
                  Show &quot;Open at button&quot;
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.behavior.closeOnResize}
                    onCheckedChange={(checked) =>
                      setState((s) => ({ ...s, behavior: { ...s.behavior, closeOnResize: checked === true } }))
                    }
                  />
                  Close on resize
                </label>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Long-press (ms)</label>
                    <Input
                      type="number"
                      className="w-20"
                      value={state.behavior.longPressMs}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          behavior: { ...s.behavior, longPressMs: Number(e.target.value) || 500 },
                        }))
                      }
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">Touch: delay before menu opens.</p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="min-w-0">
            <Card className="flex min-h-[480px] flex-col border-2 border-border/80 bg-card/95 shadow-xl shadow-black/10 dark:shadow-black/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  Sandbox
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Right-click (or long-press on touch) the zone below to open the menu.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                <div
                  ref={sandboxRef}
                  data-slot="context-menu-trigger"
                  style={{ WebkitTouchCallout: "none" }}
                  className="select-none flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white dark:bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm"
                >
                  <span className="hidden pointer-fine:inline-block">Right click here</span>
                  <span className="hidden pointer-coarse:inline-block">Long press here</span>
                </div>
                {state.useOpenAtElementButton && (
                  <Button
                    ref={openAtButtonRef}
                    type="button"
                    variant="default"
                    size="lg"
                    className="shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    Open at button
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
