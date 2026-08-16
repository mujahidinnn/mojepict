export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label=""
    >
      {/* soft background blobs, tinted per category color */}
      <circle cx="270" cy="90" r="90" className="fill-blue-500/10 dark:fill-blue-400/10" />
      <circle cx="110" cy="210" r="70" className="fill-violet-500/10 dark:fill-violet-400/10" />

      {/* back photo card, tilted */}
      <g transform="rotate(-8 150 150)">
        <rect
          x="60"
          y="60"
          width="150"
          height="150"
          rx="16"
          className="fill-card stroke-border"
          strokeWidth="1.5"
        />
        <circle cx="92" cy="94" r="10" className="fill-amber-400/70 dark:fill-amber-300/60" />
        <path
          d="M60 176 L110 128 L140 156 L170 118 L210 160 V194 A16 16 0 0 1 194 210 H76 A16 16 0 0 1 60 194 Z"
          className="fill-blue-500/15 dark:fill-blue-400/15"
        />
      </g>

      {/* front photo card, tilted opposite way */}
      <g transform="rotate(6 210 150)">
        <rect
          x="150"
          y="90"
          width="150"
          height="150"
          rx="16"
          className="fill-card stroke-border"
          strokeWidth="1.5"
        />
        <circle cx="182" cy="124" r="10" className="fill-pink-400/70 dark:fill-pink-300/60" />
        <path
          d="M150 206 L200 158 L230 186 L260 148 L300 190 V224 A16 16 0 0 1 284 240 H166 A16 16 0 0 1 150 224 Z"
          className="fill-violet-500/15 dark:fill-violet-400/15"
        />
      </g>

      {/* crop-corner accents, echoing the image-cropper tool */}
      <g className="stroke-foreground/70" strokeWidth="2.5" strokeLinecap="round">
        <path d="M40 40 V26 A6 6 0 0 1 46 20 H60" />
        <path d="M320 260 V274 A6 6 0 0 1 314 280 H300" />
      </g>

      {/* sparkle, echoing the remove-bg / AI Enhanced motif */}
      <g className="fill-amber-400 dark:fill-amber-300">
        <path d="M300 40 L305 55 L320 60 L305 65 L300 80 L295 65 L280 60 L295 55 Z" />
      </g>
      <g className="fill-emerald-500 dark:fill-emerald-400">
        <circle cx="46" cy="240" r="5" />
      </g>
    </svg>
  );
}
