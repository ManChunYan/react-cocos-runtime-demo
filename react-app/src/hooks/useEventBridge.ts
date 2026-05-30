import { useCallback, useEffect, useState } from "react";
import {
  COCOS_BRIDGE_EVENT,
  PET_GAME_EVENT,
  type PetGameBridgeEvent,
  type PetGameEventName,
  type PetGameEventPayloadMap,
} from "@feedpets/protocol";

type EventHandler<T extends PetGameEventName> = (
  payload: PetGameEventPayloadMap[T],
) => void;

export function useEventBridge(eventProxy: Element | null) {
  const [readyEventProxy, setReadyEventProxy] = useState<Element | null>(null);

  const dispatchEventToCocos = useCallback(
    <T extends PetGameEventName>(
      eventName: T,
      payload: PetGameEventPayloadMap[T],
    ) => {
      if (!eventProxy) {
        return false;
      }

      eventProxy.dispatchEvent(
        new CustomEvent<PetGameBridgeEvent<T>>(COCOS_BRIDGE_EVENT.TO_COCOS, {
          detail: { eventName, payload },
          bubbles: true,
          composed: true,
        }),
      );

      return true;
    },
    [eventProxy],
  );

  const subscribeEventFromCocos = useCallback(
    <T extends PetGameEventName>(
      eventName: T,
      handler: EventHandler<T>,
    ): (() => void) | false => {
      if (!eventProxy) {
        return false;
      }

      const listener = (event: Event) => {
        const { detail } = event as CustomEvent<PetGameBridgeEvent<T>>;

        if (detail?.eventName !== eventName) {
          return;
        }

        handler(detail.payload);
      };

      eventProxy.addEventListener(COCOS_BRIDGE_EVENT.FROM_COCOS, listener);

      return () => {
        eventProxy.removeEventListener(COCOS_BRIDGE_EVENT.FROM_COCOS, listener);
      };
    },
    [eventProxy],
  );

  useEffect(() => {
    if (!eventProxy) {
      return;
    }

    const listener = (event: Event) => {
      const { detail } = event as CustomEvent<
        PetGameBridgeEvent<typeof PET_GAME_EVENT.COCOS_READY>
      >;

      if (detail?.eventName !== PET_GAME_EVENT.COCOS_READY) {
        return;
      }

      setReadyEventProxy(eventProxy);
    };

    eventProxy.addEventListener(COCOS_BRIDGE_EVENT.FROM_COCOS, listener);

    return () => {
      eventProxy.removeEventListener(COCOS_BRIDGE_EVENT.FROM_COCOS, listener);
    };
  }, [eventProxy]);

  return {
    dispatchEventToCocos,
    subscribeEventFromCocos,
    isReady: eventProxy !== null && readyEventProxy === eventProxy,
  };
}
