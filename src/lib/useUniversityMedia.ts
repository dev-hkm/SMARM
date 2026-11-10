import { useState, useEffect } from "react";

export interface UniversityMediaItem {
  src: string;
  fallbackSrc?: string;
  alt: string;
  href?: string;
}

const CACHE = new Map<string, string[]>();
const PHOTO_TIMEOUT_MS = 60_000;

export function useUniversityMedia(
  name: string,
  url: string,
): { images: string[]; loading: boolean; error: boolean } {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const cleanName = name.trim();
    const cleanUrl = url.trim();
    const cacheKey = `${cleanName}|${cleanUrl}`;
    if (!cleanName || !cleanUrl) {
      setImages([]);
      setLoading(false);
      setError(true);
      return;
    }

    const cached = CACHE.get(cacheKey);
    if (cached) {
      setImages(cached);
      setLoading(false);
      setError(false);
      return;
    }

    // Never keep the previous school's photos on screen while the new ones load.
    setImages([]);
    setLoading(true);
    setError(false);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PHOTO_TIMEOUT_MS);

    fetch("/api/university-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: cleanName, url: cleanUrl }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const fetchedImages = Array.isArray(data?.images)
          ? data.images.filter((src: unknown): src is string => typeof src === "string" && src.startsWith("http"))
          : [];
        // Empty results are temporary (site down, slow scrape); retry next mount.
        if (fetchedImages.length > 0) CACHE.set(cacheKey, fetchedImages);
        setImages(fetchedImages);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[useUniversityMedia] failed to fetch photos for", cleanName, err);
        }
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [name, url]);

  return { images, loading, error };
}
