
interface CroppedAvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string; // Container styling classes (e.g. "w-12 h-12", "w-36 h-36")
  fallbackLetter?: string;
  fallbackClassName?: string; // Text scaling classes inside fallback circle
}

export default function CroppedAvatar({
  src,
  alt,
  className = 'w-12 h-12',
  fallbackLetter,
  fallbackClassName = 'text-[16px]'
}: CroppedAvatarProps) {
  if (!src) {
    const letter = (fallbackLetter || alt || 'P').charAt(0).toUpperCase();
    return (
      <div className={`rounded-full bg-linear-to-tr from-primary to-surface-tint flex items-center justify-center font-bold text-on-primary shadow-sm border border-white/20 capitalize select-none shrink-0 ${className}`}>
        <span className={fallbackClassName}>{letter}</span>
      </div>
    );
  }

  // Attempt to parse crop percentage coordinates from URL query parameters
  let cropParams: { cx: number; cy: number; cw: number; ch: number } | null = null;
  try {
    const url = new URL(src);
    const cx = url.searchParams.get('cx');
    const cy = url.searchParams.get('cy');
    const cw = url.searchParams.get('cw');
    const ch = url.searchParams.get('ch');

    if (cx && cy && cw && ch) {
      cropParams = {
        cx: parseFloat(cx),
        cy: parseFloat(cy),
        cw: parseFloat(cw),
        ch: parseFloat(ch)
      };
    }
  } catch (e) {
    // URL parsing failed (e.g., preset path or relative Dicebear preset url)
  }

  if (cropParams) {
    const { cx, cy, cw, ch } = cropParams;

    // Apply exact container percentage scale math for original resolution avatar rendering
    if (cw > 0 && ch > 0) {
      return (
        <div className={`relative rounded-full overflow-hidden border border-outline-variant/40 bg-surface shadow-sm shrink-0 ${className}`}>
          <img
            src={src}
            alt={alt}
            style={{
              position: 'absolute',
              width: `${100 / cw * 100}%`,
              height: `${100 / ch * 100}%`,
              left: `${-cx / cw * 100}%`,
              top: `${-cy / ch * 100}%`,
              maxWidth: 'none',
              maxHeight: 'none',
              userSelect: 'none'
            }}
          />
        </div>
      );
    }
  }

  // Standard fallback image render (Dicebear presets, uncropped uploads)
  return (
    <div className={`rounded-full overflow-hidden border border-outline-variant/40 bg-surface shadow-sm shrink-0 ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover select-none" />
    </div>
  );
}
