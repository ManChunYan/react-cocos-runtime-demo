/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COCOS_BRIDGE_EVENT,
  PET_GAME_EVENT,
  type PetGameEventName,
} from "@feedpets/protocol";

import { useEventBridge } from "../useEventBridge";

type EventBridge = ReturnType<typeof useEventBridge>;

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type HookProbeProps = {
  eventProxy: Element | null;
  onRender: (bridge: EventBridge) => void;
};

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

function HookProbe({ eventProxy, onRender }: HookProbeProps) {
  onRender(useEventBridge(eventProxy));
  return null;
}

function renderUseEventBridge(eventProxy: Element | null) {
  let currentBridge: EventBridge | undefined;
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);
  mountedRoots.push({ container, root });

  const render = (nextEventProxy: Element | null) => {
    act(() => {
      root.render(
        createElement(HookProbe, {
          eventProxy: nextEventProxy,
          onRender: (bridge) => {
            currentBridge = bridge;
          },
        }),
      );
    });
  };

  render(eventProxy);

  return {
    get bridge() {
      if (!currentBridge) {
        throw new Error("useEventBridge did not render");
      }

      return currentBridge;
    },
    rerender: render,
  };
}

const createBridgeEvent = (eventName: PetGameEventName, payload: unknown) =>
  new CustomEvent(COCOS_BRIDGE_EVENT.FROM_COCOS, {
    detail: { eventName, payload },
    bubbles: true,
    composed: true,
  });

afterEach(() => {
  mountedRoots.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount();
    });

    container.remove();
  });
});

describe("useEventBridge", () => {
  it("returns not ready and does not dispatch or subscribe without an event proxy", () => {
    const { bridge } = renderUseEventBridge(null);

    expect(bridge.isReady).toBe(false);
    expect(
      bridge.dispatchEventToCocos(PET_GAME_EVENT.ACTION, { action: "feed" }),
    ).toBe(false);
    expect(
      bridge.subscribeEventFromCocos(PET_GAME_EVENT.CLICKED, vi.fn()),
    ).toBe(false);
  });

  it("dispatches typed bridge events to Cocos", () => {
    const eventProxy = document.createElement("div");
    const listener = vi.fn();

    eventProxy.addEventListener(COCOS_BRIDGE_EVENT.TO_COCOS, listener);

    const { bridge } = renderUseEventBridge(eventProxy);
    const result = bridge.dispatchEventToCocos(PET_GAME_EVENT.ACTION, {
      action: "pet",
    });
    const event = listener.mock.calls[0]?.[0] as CustomEvent;

    expect(result).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(event.type).toBe(COCOS_BRIDGE_EVENT.TO_COCOS);
    expect(event.detail).toEqual({
      eventName: PET_GAME_EVENT.ACTION,
      payload: { action: "pet" },
    });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("subscribes to matching events from Cocos and unsubscribes cleanly", () => {
    const eventProxy = document.createElement("div");
    const handler = vi.fn();
    const { bridge } = renderUseEventBridge(eventProxy);

    const unsubscribe = bridge.subscribeEventFromCocos(
      PET_GAME_EVENT.CLICKED,
      handler,
    );

    expect(unsubscribe).toEqual(expect.any(Function));

    eventProxy.dispatchEvent(
      createBridgeEvent(PET_GAME_EVENT.ACTION, { action: "dance" }),
    );
    eventProxy.dispatchEvent(
      createBridgeEvent(PET_GAME_EVENT.CLICKED, { affectionDelta: 3 }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ affectionDelta: 3 });

    if (unsubscribe) {
      unsubscribe();
    }

    eventProxy.dispatchEvent(
      createBridgeEvent(PET_GAME_EVENT.CLICKED, { affectionDelta: 5 }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("marks the bridge ready only after Cocos sends the ready event", () => {
    const eventProxy = document.createElement("div");
    const rendered = renderUseEventBridge(eventProxy);

    expect(rendered.bridge.isReady).toBe(false);

    act(() => {
      eventProxy.dispatchEvent(
        createBridgeEvent(PET_GAME_EVENT.COCOS_READY, {}),
      );
    });

    expect(rendered.bridge.isReady).toBe(true);
  });

  it("resets ready state when the event proxy changes", () => {
    const firstEventProxy = document.createElement("div");
    const secondEventProxy = document.createElement("div");
    const rendered = renderUseEventBridge(firstEventProxy);

    act(() => {
      firstEventProxy.dispatchEvent(
        createBridgeEvent(PET_GAME_EVENT.COCOS_READY, {}),
      );
    });

    expect(rendered.bridge.isReady).toBe(true);

    rendered.rerender(secondEventProxy);

    expect(rendered.bridge.isReady).toBe(false);
  });
});
