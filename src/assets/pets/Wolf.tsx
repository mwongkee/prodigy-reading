import { color } from '../../ui/theme';
import type { PetMood } from './Pet';

interface WolfProps {
  /** Main fur color (token or hex). */
  bodyColor: string;
  /** Grey shading color (token or hex). */
  accentColor: string;
  /** Evolution stage 0=Luminex, 1=Luminite, 2=Luminaut. */
  stage: number;
  mood: PetMood;
  size: number;
}

const FROST = '#7fd1ff';
const FROST_DEEP = '#39a7e8';

/** A small upward ice crystal (diamond) used as frost decoration. */
function Crystal({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.6} ${y} L${x} ${y + s} L${x - s * 0.6} ${y} Z`}
      fill={fill}
      stroke="#2b2440"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}

/**
 * Luminex the frost wolf, sitting with one paw raised. Modular layers (tail,
 * body, legs, raised paw, head, frost accents) so it recolors and evolves:
 * stage 1 adds a frost mane + glowing eyes, stage 2 adds an ice crown + aura.
 * See docs/style-guide.md.
 */
export function Wolf({ bodyColor, accentColor, stage, mood, size }: WolfProps) {
  const fur = color(bodyColor);
  const shade = color(accentColor);
  const ink = '#2b2440';

  return (
    <svg
      className="pet"
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Luminex, your frost wolf"
    >
      <defs>
        <radialGradient id="wolf-body" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={fur} />
        </radialGradient>
        <radialGradient id="wolf-aura" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={FROST} stopOpacity="0" />
          <stop offset="100%" stopColor={FROST} stopOpacity="0.45" />
        </radialGradient>
      </defs>

      {/* aura (Luminaut) */}
      {stage >= 2 && <circle cx="100" cy="104" r="92" fill="url(#wolf-aura)" />}

      {/* ground shadow */}
      <ellipse cx="100" cy="186" rx="52" ry="9" fill={ink} opacity="0.12" />

      {/* tail */}
      <path
        d="M62 160 C24 158 22 116 42 104 C46 128 60 138 74 144 Z"
        fill={fur}
        stroke={ink}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M30 116 C26 130 34 142 46 146 C40 132 36 124 38 110 Z" fill={shade} opacity="0.7" />

      {/* sitting body */}
      <path
        d="M66 176 Q58 116 100 108 Q142 116 134 176 Q100 190 66 176 Z"
        fill="url(#wolf-body)"
        stroke={ink}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* belly */}
      <ellipse cx="100" cy="150" rx="27" ry="33" fill="#ffffff" opacity="0.85" />

      {/* resting front leg + paw */}
      <rect x="72" y="150" width="26" height="34" rx="12" fill={fur} stroke={ink} strokeWidth="4" />
      <ellipse cx="85" cy="182" rx="15" ry="8" fill={fur} stroke={ink} strokeWidth="3" />

      {/* raised paw (the signature held-up paw) */}
      <path d="M120 150 Q142 140 150 110" fill="none" stroke={ink} strokeWidth="22" strokeLinecap="round" />
      <path d="M120 150 Q142 140 150 110" fill="none" stroke={fur} strokeWidth="15" strokeLinecap="round" />
      <circle cx="152" cy="104" r="13" fill={fur} stroke={ink} strokeWidth="3" />
      <circle cx="148" cy="102" r="2.4" fill={ink} />
      <circle cx="155" cy="101" r="2.4" fill={ink} />
      <circle cx="152" cy="108" r="2.4" fill={ink} />

      {/* head */}
      {/* ears */}
      <path d="M70 46 L56 8 L98 38 Z" fill={fur} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M130 46 L144 8 L102 38 Z" fill={fur} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M75 40 L66 17 L92 36 Z" fill={shade} />
      <path d="M125 40 L134 17 L108 36 Z" fill={shade} />

      <circle cx="100" cy="72" r="42" fill="url(#wolf-body)" stroke={ink} strokeWidth="4" />

      {/* frost mane (Luminite+) */}
      {stage >= 1 && (
        <>
          <Crystal x={66} y={70} s={9} fill={FROST} />
          <Crystal x={134} y={70} s={9} fill={FROST} />
          <Crystal x={72} y={52} s={6} fill={FROST} />
          <Crystal x={128} y={52} s={6} fill={FROST} />
        </>
      )}

      {/* muzzle */}
      <ellipse cx="100" cy="86" rx="22" ry="17" fill="#ffffff" stroke={ink} strokeWidth="2" opacity="0.95" />

      {/* eyes (glow when evolved) */}
      {stage >= 1 && (
        <>
          <circle cx="84" cy="66" r="13" fill={FROST} opacity="0.5" />
          <circle cx="116" cy="66" r="13" fill={FROST} opacity="0.5" />
        </>
      )}
      <circle cx="84" cy="66" r="10" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle cx="116" cy="66" r="10" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle cx="86" cy="68" r="5" fill={stage >= 1 ? FROST_DEEP : ink} />
      <circle cx="118" cy="68" r="5" fill={stage >= 1 ? FROST_DEEP : ink} />

      {/* nose + mouth */}
      <path d="M93 80 Q100 76 107 80 Q103 89 100 89 Q97 89 93 80 Z" fill={ink} />
      {mood === 'hurt' ? (
        <path d="M90 100 Q100 94 110 100" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <>
          <path d="M100 89 Q100 98 90 99" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M100 89 Q100 98 110 99" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* cheeks when happy/attacking */}
      {(mood === 'happy' || mood === 'attack') && (
        <>
          <circle cx="70" cy="84" r="6" fill="#ff8a7a" opacity="0.5" />
          <circle cx="130" cy="84" r="6" fill="#ff8a7a" opacity="0.5" />
        </>
      )}

      {/* ice crown (Luminaut) */}
      {stage >= 2 && (
        <>
          <Crystal x={100} y={20} s={16} fill={FROST} />
          <Crystal x={82} y={26} s={11} fill={FROST} />
          <Crystal x={118} y={26} s={11} fill={FROST} />
        </>
      )}

      {/* base frost crystals (always present, more as it grows) */}
      <Crystal x={58} y={178} s={7} fill={FROST} />
      <Crystal x={142} y={178} s={7} fill={FROST} />
      {stage >= 1 && <Crystal x={120} y={184} s={6} fill={FROST} />}
    </svg>
  );
}
