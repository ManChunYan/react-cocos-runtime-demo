import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useEventBridge } from "../hooks/useEventBridge";

type EventBridgeContextValue = ReturnType<typeof useEventBridge>;

export const EventBridgeContext =
  createContext<EventBridgeContextValue | null>(null);
export const SetEventProxyContext = createContext<Dispatch<
  SetStateAction<Element | null>
> | null>(null);

export function useCocosEventBridge() {
  const bridge = useContext(EventBridgeContext);

  if (!bridge) {
    throw new Error(
      "useCocosEventBridge must be used inside EventBridgeProvider",
    );
  }

  return bridge;
}

export function useSetCocosEventProxy() {
  const setEventProxy = useContext(SetEventProxyContext);

  if (!setEventProxy) {
    throw new Error(
      "useSetCocosEventProxy must be used inside EventBridgeProvider",
    );
  }

  return setEventProxy;
}
