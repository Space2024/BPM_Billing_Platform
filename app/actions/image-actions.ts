"use server";

/**
 * Fetch a remote image and return it as a data URI.
 *
 * The membership code is served from another origin. Drawing a cross-origin
 * image onto a canvas taints it, which makes the Save card capture fail, so the
 * bytes are proxied through the server and handed to the browser inline.
 *
 * Returns null on any failure. The caller falls back to the original URL, which
 * still displays correctly, only the capture is affected.
 */
export async function fetchProxyImageBase64(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get("content-type") || "image/png";

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("[Server Action] Failed to proxy image:", error);
    return null;
  }
}
