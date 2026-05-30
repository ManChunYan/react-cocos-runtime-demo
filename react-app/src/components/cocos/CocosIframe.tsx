import { type SyntheticEvent, useCallback, useEffect } from "react";
import { COCOS_EVENT_PROXY_ID } from "@feedpets/protocol";

import { ENV_CONFIG } from "../../config";
import { useSetCocosEventProxy } from "../../contexts/EventBridgeContext";
import { useCocosIframeSrc } from "../../hooks/useCocosIframeSrc";

export function CocosIframe() {
  const setEventProxy = useSetCocosEventProxy();

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      const iframe = event.currentTarget;
      const eventProxy = iframe.contentDocument?.querySelector(
        `#${COCOS_EVENT_PROXY_ID}`,
      );
      const gameContainer = iframe.contentDocument?.querySelector(
        "#Cocos3dGameContainer",
      );

      if (!eventProxy || !gameContainer) {
        console.error("Failed to find EventProxy or GameContainer in iframe");
        return;
      }

      setEventProxy(eventProxy);
    },
    [setEventProxy],
  );

  useEffect(() => {
    return () => {
      setEventProxy(null);
    };
  }, [setEventProxy]);

  const { blobUrl } = useCocosIframeSrc({
    cocosUrl: ENV_CONFIG.cocosUrl,
  });

  return (
    <iframe
      src={blobUrl}
      title="cocosView"
      className="cocos-container"
      style={{ width: "100%", height: "100%", borderWidth: 0 }}
      onLoad={handleLoad}
    />
  );
}
