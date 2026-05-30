import { useEffect, useMemo } from "react";

export function useBlobUrl(
  content: string | BlobPart[],
  options?: BlobPropertyBag,
): string {
  const { type, endings } = options || {};

  const blobUrl = useMemo(() => {
    const contentArray = typeof content === "string" ? [content] : content;
    const blob = new Blob(contentArray, { type, endings });
    return URL.createObjectURL(blob);
  }, [content, type, endings]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return blobUrl;
}
