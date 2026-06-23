import { color } from '../../ui/theme';

export type PetMood = 'idle' | 'attack' | 'hurt' | 'happy';

interface PetProps {
  /** Body color token or hex. Different colors = different "species". */
  bodyColor?: string;
  /** Belly/accent color token or hex. */
  accentColor?: string;
  /** Evolution stage 0..2 — bigger + extra accents as it grows. */
  stage?: number;
  mood?: PetMood;
  size?: number;
}

/**
 * Modular SVG pet ("cozy creature"). Built from layered parts (body, belly,
 * face, accent) driven by props so one shape recolors and evolves into many
 * pets — see docs/style-guide.md. All vector, free, and animatable via the
 * `data-mood` CSS hooks in index.css.
 */
export function Pet({
  bodyColor = 'sky',
  accentColor = 'sun',
  stage = 0,
  mood = 'idle',
  size = 160,
}: PetProps) {
  const body = color(bodyColor);
  const accent = color(accentColor);
  const ink = color('ink');

  return (
    <svg
      className="pet"
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Your reading pet"
    >
      <defs>
        <radialGradient id={`g-${bodyColor}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={lighten(body)} />
          <stop offset="100%" stopColor={body} />
        </radialGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="100" cy="178" rx="48" ry="9" fill={ink} opacity="0.12" />

      {/* ears/horns grow with stage (accent layer) */}
      {stage >= 1 && (
        <>
          <path d="M62 56 L50 22 L82 46 Z" fill={accent} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M138 56 L150 22 L118 46 Z" fill={accent} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        </>
      )}
      {stage >= 2 && (
        <circle cx="100" cy="20" r="9" fill={color('coral')} stroke={ink} strokeWidth="3" />
      )}

      {/* body */}
      <circle cx="100" cy="110" r="62" fill={`url(#g-${bodyColor})`} stroke={ink} strokeWidth="4" />
      {/* belly */}
      <ellipse cx="100" cy="128" rx="36" ry="40" fill={accent} opacity="0.85" />

      {/* eyes */}
      <circle cx="80" cy="100" r="11" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle cx="120" cy="100" r="11" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle cx="82" cy="102" r="5" fill={ink} />
      <circle cx="122" cy="102" r="5" fill={ink} />

      {/* mouth changes with mood */}
      {mood === 'hurt' ? (
        <path d="M86 134 Q100 124 114 134" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M84 130 Q100 146 116 130" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      )}

      {/* cheeks when happy/attacking */}
      {(mood === 'happy' || mood === 'attack') && (
        <>
          <circle cx="68" cy="118" r="7" fill={color('coral')} opacity="0.5" />
          <circle cx="132" cy="118" r="7" fill={color('coral')} opacity="0.5" />
        </>
      )}
    </svg>
  );
}

function lighten(hex: string): string {
  // crude lighten: blend toward white
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.min(255, ((n >> 16) & 255) + 40);
  const g = Math.min(255, ((n >> 8) & 255) + 40);
  const b = Math.min(255, (n & 255) + 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
