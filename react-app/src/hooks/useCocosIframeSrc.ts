import { useMemo } from "react";
import { COCOS_EVENT_PROXY_ID } from "@feedpets/protocol";
import { useBlobUrl } from "./useBlobUrl";

type UseCocosIframeSrcOptions = {
  cocosUrl: string;
};

const iframeCss = `
  html,
  body,
  #GameDiv,
  #Cocos3dGameContainer {
    width: 100%;
    height: 100%;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: transparent;
  }

  #GameDiv,
  #Cocos3dGameContainer {
    display: block;
    position: relative;
    overflow: hidden;
  }

  #GameCanvas {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
  }

  #EventProxy {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
`;

export function useCocosIframeSrc({ cocosUrl }: UseCocosIframeSrcOptions) {
  const contentDoc = useMemo(() => {
    const normalizedCocosUrl = cocosUrl.endsWith("/")
      ? cocosUrl
      : `${cocosUrl}/`;

    return `
     <html>
       <head>
         <base href="${normalizedCocosUrl}">
         <style>
           ${iframeCss}
         </style>
       </head>
       <body>
         <div id="GameDiv">
           <div id="Cocos3dGameContainer">
             <canvas id="GameCanvas"></canvas>
           </div>
         </div>
         <div id="${COCOS_EVENT_PROXY_ID}"></div>
         <script src="${normalizedCocosUrl}src/polyfills.bundle.js"></script>
         <script src="${normalizedCocosUrl}src/system.bundle.js"></script>
         <script type="systemjs-importmap">{"imports":{"cc":"${normalizedCocosUrl}cocos-js/cc.js"}}</script>
         <script>
           System.import('${normalizedCocosUrl}index.js').catch(function(err) { console.error(err); })
         </script>
       </body>
     </html>
   `;
  }, [cocosUrl]);

  const blobUrl = useBlobUrl(contentDoc, { type: "text/html" });

  return { blobUrl, contentDoc };
}
