import { color } from '../../ui/theme';
import { ELEMENTS, type ElementId } from '../../content/elements';
import type { PetMood } from './Pet';

interface PlaceholderProps {
  element: ElementId;
  stage: number;
  mood: PetMood;
  size: number;
}

/**
 * Stand-in shown until a generated sprite is dropped in. A friendly
 * element-tinted blob with big eyes + the element badge, dashed to signal
 * "art coming". Keeps the game playable and the build green before any art.
 */
export function Placeholder({ element, stage, mood, size }: PlaceholderProps) {
  const meta = ELEMENTS[element];
  const tint = color(meta.color);
  const ink = '#2b2440';
  const scale = 1 + stage * 0.06;

  return (
    <svg
      className="pet"
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${meta.name} pet (art coming soon)`}
    >
      <defs>
        <radialGradient id={`ph-${element}`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={tint} />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="178" rx="46" ry="8" fill={ink} opacity="0.12" />

      <g transform={`translate(100 110) scale(${scale}) translate(-100 -110)`}>
        {/* rounded body */}
        <path
          d="M100 46 C150 46 162 92 158 124 C154 160 130 176 100 176 C70 176 46 160 42 124 C38 92 50 46 100 46 Z"
          fill={`url(#ph-${element})`}
          stroke={ink}
          strokeWidth="4"
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
        {/* eyes */}
        <circle cx="82" cy="104" r="11" fill="#fff" stroke={ink} strokeWidth="3" />
        <circle cx="118" cy="104" r="11" fill="#fff" stroke={ink} strokeWidth="3" />
        <circle cx="84" cy="106" r="5" fill={ink} />
        <circle cx="120" cy="106" r="5" fill={ink} />
        <circle cx="86" cy="103" r="1.6" fill="#fff" />
        <circle cx="122" cy="103" r="1.6" fill="#fff" />
        {/* smile */}
        {mood === 'hurt' ? (
          <path d="M86 134 Q100 126 114 134" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M86 130 Q100 142 114 130" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        )}
      </g>

      {/* element badge */}
      <text x="100" y="40" fontSize="26" textAnchor="middle">{meta.emoji}</text>
    </svg>
  );
}
