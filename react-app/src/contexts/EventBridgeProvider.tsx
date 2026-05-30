import { useState, type ReactNode } from "react";

import { EventBridgeContext, SetEventProxyContext } from "./EventBridgeContext";
import { useEventBridge } from "../hooks/useEventBridge";

export function EventBridgeProvider({ children }: { children: ReactNode }) {
  const [eventProxy, setEventProxy] = useState<Element | null>(null);
  const bridge = useEventBridge(eventProxy);

  return (
    <SetEventProxyContext.Provider value={setEventProxy}>
      <EventBridgeContext.Provider value={bridge}>
        {children}
      </EventBridgeContext.Provider>
    </SetEventProxyContext.Provider>
  );
}
