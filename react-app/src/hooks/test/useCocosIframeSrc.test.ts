/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COCOS_EVENT_PROXY_ID } from "@feedpets/protocol";

const useBlobUrlMock = vi.hoisted(() =>
  vi.fn((content: string | BlobPart[], options?: BlobPropertyBag) => {
    const contentText = typeof content === "string" ? content : content.join("");

    return `blob:mock-${contentText.length}-${options?.type ?? "unknown"}`;
  }),
);

vi.mock("../useBlobUrl", () => ({
  useBlobUrl: useBlobUrlMock,
}));

import { useCocosIframeSrc } from "../useCocosIframeSrc";

type CocosIframeSrc = ReturnType<typeof useCocosIframeSrc>;

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

type HookProbeProps = {
  cocosUrl: string;
  onRender: (result: CocosIframeSrc) => void;
};

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

function HookProbe({ cocosUrl, onRender }: HookProbeProps) {
  onRender(useCocosIframeSrc({ cocosUrl }));
  return null;
}

function renderUseCocosIframeSrc(cocosUrl: string) {
  let currentResult: CocosIframeSrc | undefined;
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.append(container);
  mountedRoots.push({ container, root });

  const render = (nextCocosUrl: string) => {
    act(() => {
      root.render(
        createElement(HookProbe, {
          cocosUrl: nextCocosUrl,
          onRender: (result) => {
            currentResult = result;
          },
        }),
      );
    });
  };

  render(cocosUrl);

  return {
    get result() {
      if (!currentResult) {
        throw new Error("useCocosIframeSrc did not render");
      }

      return currentResult;
    },
    rerender: render,
  };
}

function parseContentDoc(contentDoc: string) {
  return new DOMParser().parseFromString(contentDoc, "text/html");
}

beforeEach(() => {
  useBlobUrlMock.mockClear();
});

afterEach(() => {
  mountedRoots.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount();
    });

    container.remove();
  });
});

describe("useCocosIframeSrc", () => {
  it("returns the blob URL generated from the iframe HTML", () => {
    const { result } = renderUseCocosIframeSrc("/cocos-game/web-desktop");

    expect(result.blobUrl).toMatch(/^blob:mock-\d+-text\/html$/);
    expect(useBlobUrlMock).toHaveBeenCalledTimes(1);
    expect(useBlobUrlMock).toHaveBeenCalledWith(result.contentDoc, {
      type: "text/html",
    });
  });

  it("normalizes cocosUrl by adding a trailing slash", () => {
    const { result } = renderUseCocosIframeSrc("/cocos-game/web-desktop");
    const doc = parseContentDoc(result.contentDoc);

    expect(doc.querySelector("base")?.getAttribute("href")).toBe(
      "/cocos-game/web-desktop/",
    );
    expect(result.contentDoc).toContain(
      'src="/cocos-game/web-desktop/src/polyfills.bundle.js"',
    );
    expect(result.contentDoc).toContain(
      'src="/cocos-game/web-desktop/src/system.bundle.js"',
    );
    expect(result.contentDoc).toContain(
      '"cc":"/cocos-game/web-desktop/cocos-js/cc.js"',
    );
    expect(result.contentDoc).toContain(
      "System.import('/cocos-game/web-desktop/index.js')",
    );
  });

  it("keeps an existing trailing slash without adding another one", () => {
    const { result } = renderUseCocosIframeSrc("/cocos-game/web-desktop/");
    const doc = parseContentDoc(result.contentDoc);

    expect(doc.querySelector("base")?.getAttribute("href")).toBe(
      "/cocos-game/web-desktop/",
    );
    expect(result.contentDoc).not.toContain("/cocos-game/web-desktop//");
  });

  it("includes the DOM nodes required by the Cocos game and event bridge", () => {
    const { result } = renderUseCocosIframeSrc("/cocos-game/web-desktop");
    const doc = parseContentDoc(result.contentDoc);

    expect(doc.querySelector("#GameDiv")).not.toBeNull();
    expect(doc.querySelector("#Cocos3dGameContainer")).not.toBeNull();
    expect(doc.querySelector("#GameCanvas")).not.toBeNull();
    expect(doc.querySelector(`#${COCOS_EVENT_PROXY_ID}`)).not.toBeNull();
  });

  it("updates the iframe HTML when cocosUrl changes", () => {
    const rendered = renderUseCocosIframeSrc("/first-build");

    expect(rendered.result.contentDoc).toContain("/first-build/index.js");

    rendered.rerender("/second-build");

    expect(rendered.result.contentDoc).toContain("/second-build/index.js");
    expect(rendered.result.contentDoc).not.toContain("/first-build/index.js");
    expect(useBlobUrlMock).toHaveBeenCalledTimes(2);
  });
});
