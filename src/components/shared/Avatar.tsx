import Image from "next/image";

export function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground-secondary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
