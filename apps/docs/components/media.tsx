import { basePath } from "@/lib/shared";

interface MediaProps {
  /** What the image or video shows. It is the alt text, and the text of the placeholder. */
  label: string;
  /** A file in `public/media`, for example `hero.mp4` or `chat.png`. Without it, a placeholder shows. */
  file?: string;
  ratio?: "video" | "wide" | "square";
}

const ratios = {
  video: "aspect-video",
  wide: "aspect-[21/9]",
  square: "aspect-square",
};

export function Media({ label, file, ratio = "video" }: MediaProps) {
  const frame = `${ratios[ratio]} w-full overflow-hidden rounded-xl border bg-fd-card`;

  if (!file) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-1 border-dashed p-4 text-center`}>
        <span className="text-sm font-medium text-fd-muted-foreground">{label}</span>
        <span className="text-xs text-fd-muted-foreground/70">Placeholder</span>
      </div>
    );
  }

  const src = `${basePath}/media/${file}`;

  if (/\.(mp4|webm)$/.test(file)) {
    return <video className={`${frame} object-cover`} src={src} aria-label={label} autoPlay muted loop playsInline />;
  }

  // eslint-disable-next-line @next/next/no-img-element -- the site is a static export, which has no image optimizer
  return <img className={`${frame} object-cover`} src={src} alt={label} loading="lazy" />;
}
