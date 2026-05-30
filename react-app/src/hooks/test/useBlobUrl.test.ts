/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBlobUrl } from "../useBlobUrl";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type HookProbeProps = {
  content: string | BlobPart[];
  options?: BlobPropertyBag;
  onRender: (blobUrl: string) => void;
};

type MountedRoot = {
  container: HTMLDivElement;
  root: Root;
};

const mountedRoots: MountedRoot[] = [];

const createObjectURLMock = vi.fn<(blob: Blob) => string>();
const revokeObjectURLMock = vi.fn<(blobUrl: string) => void>();

function readBlobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result));
    });
    reader.addEventListener("error", () => {
      reject(reader.error);
    });
    reader.readAsText(blob);
  });
}

function HookProbe({ content, options, onRender }: HookProbeProps) {
  onRender(useBlobUrl(content, options));
  return null;
}

function renderUseBlobUrl(
  content: string | BlobPart[],
  options?: BlobPropertyBag,
) {
  let currentBlobUrl: string | undefined;
  const container = document.createElement("div");
  const root = createRoot(container);
  const mountedRoot = { container, root };

  document.body.append(container);
  mountedRoots.push(mountedRoot);

  const render = (
    nextContent: string | BlobPart[],
    nextOptions?: BlobPropertyBag,
  ) => {
    act(() => {
      root.render(
        createElement(HookProbe, {
          content: nextContent,
          options: nextOptions,
          onRender: (blobUrl) => {
            currentBlobUrl = blobUrl;
          },
        }),
      );
    });
  };

  const unmount = () => {
    act(() => {
      root.unmount();
    });

    container.remove();
    const index = mountedRoots.indexOf(mountedRoot);

    if (index >= 0) {
      mountedRoots.splice(index, 1);
    }
  };

  render(content, options);

  return {
    get blobUrl() {
      if (!currentBlobUrl) {
        throw new Error("useBlobUrl did not render");
      }

      return currentBlobUrl;
    },
    rerender: render,
    unmount,
  };
}

beforeEach(() => {
  createObjectURLMock.mockImplementation(
    () => `blob:mock-${createObjectURLMock.mock.calls.length}`,
  );
  revokeObjectURLMock.mockReturnValue(undefined);

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURLMock,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURLMock,
  });
});

afterEach(() => {
  mountedRoots.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount();
    });

    container.remove();
  });

  vi.clearAllMocks();
});

describe("useBlobUrl", () => {
  it("creates a blob URL for string content with the provided type", async () => {
    const rendered = renderUseBlobUrl("<html></html>", { type: "text/html" });
    const blob = createObjectURLMock.mock.calls[0]?.[0];

    expect(rendered.blobUrl).toBe("blob:mock-1");
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe("text/html");
    await expect(readBlobText(blob as Blob)).resolves.toBe("<html></html>");
  });

  it("creates a blob URL for BlobPart array content", async () => {
    renderUseBlobUrl(["hello", " ", "world"], { type: "text/plain" });
    const blob = createObjectURLMock.mock.calls[0]?.[0];

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(blob?.type).toBe("text/plain");
    await expect(readBlobText(blob as Blob)).resolves.toBe("hello world");
  });

  it("revokes the blob URL when unmounted", () => {
    const rendered = renderUseBlobUrl("content");

    rendered.unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-1");
  });

  it("creates a new URL and revokes the old URL when content changes", async () => {
    const rendered = renderUseBlobUrl("old");

    expect(rendered.blobUrl).toBe("blob:mock-1");

    rendered.rerender("new");

    const newBlob = createObjectURLMock.mock.calls[1]?.[0];

    expect(rendered.blobUrl).toBe("blob:mock-2");
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-1");
    await expect(readBlobText(newBlob as Blob)).resolves.toBe("new");
  });

  it("creates a new URL and revokes the old URL when options change", () => {
    const rendered = renderUseBlobUrl("content", { type: "text/plain" });

    expect(rendered.blobUrl).toBe("blob:mock-1");

    rendered.rerender("content", { type: "text/html" });

    const newBlob = createObjectURLMock.mock.calls[1]?.[0];

    expect(rendered.blobUrl).toBe("blob:mock-2");
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-1");
    expect(newBlob?.type).toBe("text/html");
  });
});
