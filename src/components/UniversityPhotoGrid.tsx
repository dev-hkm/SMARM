import { useEffect, useState } from "react";
import { useUniversityMedia } from "../lib/useUniversityMedia";

interface UniversityPhotoGridProps {
  url: string;
  title: string;
}

const SLOT_COUNT = 4;
const MIN_WIDTH = 420;
const MIN_HEIGHT = 220;
const SLOT_LABEL = "Hình ảnh trường";

export default function UniversityPhotoGrid({ url, title }: UniversityPhotoGridProps) {
  const uniName = title || url;
  const { images, loading, error } = useUniversityMedia(uniName, url);
  const [badSlots, setBadSlots] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setBadSlots({});
  }, [images]);

  const markBad = (index: number) =>
    setBadSlots((previous) => (previous[index] ? previous : { ...previous, [index]: true }));

  const available = error
    ? []
    : images
        .slice(0, SLOT_COUNT)
        .map((src, index) => ({ src, index }))
        .filter((entry) => !badSlots[entry.index]);
  const slotCount = Math.max(available.length, 1);

  const layoutClass = (index: number) => {
    if (slotCount === 1) return "col-span-2 aspect-[16/9]";
    if (slotCount === 3 && index === 0) return "col-span-2 aspect-[21/9]";
    return "aspect-[16/9]";
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {Array.from({ length: slotCount }, (_, index) => {
        const entry = available[index];
        const imageSrc = entry?.src;
        const imageIndex = entry?.index ?? index;
        const usable = Boolean(imageSrc);
        const showSpinner = loading && !imageSrc;
        const showPlaceholder = !showSpinner && !usable;

        return (
          <div
            key={imageIndex}
            className={`block group relative overflow-hidden border-[3px] border-black transition-all shadow-[4px_4px_0_#000] bg-[var(--color-yellow-pop)] ${layoutClass(index)}`}
          >
            {index === 0 && (
              <span className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest select-none">
                {SLOT_LABEL}
              </span>
            )}

            {showSpinner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-yellow-pop)] text-black gap-2">
                <div className="w-6 h-6 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Đang tải ảnh</span>
              </div>
            )}

            {usable && (
              <a
                href={imageSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="block absolute inset-0"
              >
                <img
                  src={imageSrc}
                  alt={`${uniName} - ảnh ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth < MIN_WIDTH || image.naturalHeight < MIN_HEIGHT) {
                      markBad(imageIndex);
                    }
                  }}
                  onError={() => markBad(imageIndex)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 bg-white border-[2px] border-black text-black text-sm font-black px-4 py-2 uppercase transition-opacity shadow-[2px_2px_0_#000]">
                    Xem ảnh
                  </div>
                </div>
              </a>
            )}

            {showPlaceholder && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-yellow-pop)] text-black p-4 text-center">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.902 59.902 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-8.25"
                  />
                </svg>
                <p className="font-black text-[10px] uppercase tracking-widest line-clamp-2">{uniName}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
