import { color } from '../../ui/theme';
import { mulberry32, hashString } from '../../engine/rng';
import type { PetGenome } from '../../content/genome';
import type { PetMood } from './Pet';

/**
 * The parametric pet "rig": draws a polished chibi creature purely from a
 * PetGenome's numbers + style choices, on the shared 200×200 viewBox and in the
 * house style (soft radial-gradient body, 4px ink outline, round joins, mood
 * face-swaps, stage growth). One rig → infinite on-style creatures, no AI.
 */
interface CreatureProps {
  genome: PetGenome;
  stage?: number;
  mood?: PetMood;
  size?: number;
}

const INK = '#2b2440';
const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp01(t);
const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
  `M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} Z`;

/** Crude lighten toward white for the body gradient's top stop. */
function lighten(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.min(255, ((n >> 16) & 255) + 46);
  const g = Math.min(255, ((n >> 8) & 255) + 46);
  const b = Math.min(255, (n & 255) + 46);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function Creature({ genome, stage = 0, mood = 'idle', size = 160 }: CreatureProps) {
  const body = color(genome.bodyColor);
  const accent = color(genome.accentColor);
  const gid = `cr-${hashString(body + accent + genome.element)}`;
  const grow = 1 + stage * 0.06;

  // --- body silhouette ---
  let rx = lerp(46, 70, genome.bodyW);
  let ry = lerp(50, 72, genome.bodyH);
  const cx = 100;
  let cy = 116;
  if (genome.bodyShape === 'egg') {
    rx *= 0.9;
    ry *= 1.1;
    cy = 118;
  } else if (genome.bodyShape === 'bean') {
    rx *= 1.06;
    ry *= 0.94;
  }
  const top = cy - ry;

  // --- feature geometry ---
  const eyeY = cy - ry * 0.28;
  const eyeDX = lerp(15, 30, genome.eyeSpacing);
  const eyeR = lerp(8, 14, genome.eyeSize) * (genome.eyeStyle === 'big' ? 1.25 : 1);
  const mouthY = eyeY + eyeR + 14;

  const earS = lerp(11, 26, genome.earSize);
  const earDX = rx * 0.6;
  const earTilt = lerp(-10, 14, genome.earAngle);

  const legLen = lerp(6, 20, genome.legLength);
  const legY = cy + ry - 4;
  const legDX = rx * 0.44;

  const horns = Math.round(lerp(0, 3, genome.hornCount));
  const spikes = Math.round(lerp(0, 6, genome.spikeAmount));

  return (
    <svg
      className="pet"
      data-mood={mood}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Your created pet"
    >
      <defs>
        <radialGradient id={gid} cx="50%" cy="36%" r="72%">
          <stop offset="0%" stopColor={lighten(body)} />
          <stop offset="100%" stopColor={body} />
        </radialGradient>
      </defs>

      {/* ground shadow (outside the grow transform so it stays planted) */}
      <ellipse cx={cx} cy="188" rx={rx * 0.7} ry="9" fill={INK} opacity="0.12" />

      <g transform={`translate(${cx} ${cy}) scale(${grow}) translate(${-cx} ${-cy})`}>
        {renderTail(genome, accent, cx, cy, rx, ry)}
        {renderDorsalSpikes(spikes, accent, cx, cy, rx, ry)}
        {renderLegs(body, cx, legY, legDX, legLen)}
        {renderEars(genome, body, accent, cx, top, earDX, earS, earTilt)}
        {renderHorns(horns, accent, cx, top)}

        {/* body */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${gid})`} stroke={INK} strokeWidth="4" />

        {renderPattern(genome, accent, cx, cy, rx, ry)}
        {renderEyes(genome, eyeY, eyeDX, eyeR, mood)}
        {renderMouth(genome, cx, mouthY, mood)}
        {(mood === 'happy' || mood === 'attack') && (
          <>
            <circle cx={cx - eyeDX - 4} cy={mouthY - 4} r="6" fill="#ff8a7a" opacity="0.45" />
            <circle cx={cx + eyeDX + 4} cy={mouthY - 4} r="6" fill="#ff8a7a" opacity="0.45" />
          </>
        )}

        {/* evolution sparkles */}
        {stage >= 1 && <Sparkle x={cx + rx * 0.78} y={top + 10} s={7} fill={accent} />}
        {stage >= 2 && (
          <>
            <Sparkle x={cx - rx * 0.82} y={top + 18} s={6} fill={accent} />
            <Sparkle x={cx} y={top - 6} s={9} fill={accent} />
          </>
        )}
      </g>
    </svg>
  );
}

function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.32} ${y - s * 0.32} L${x + s} ${y} L${x + s * 0.32} ${y + s * 0.32} L${x} ${y + s} L${x - s * 0.32} ${y + s * 0.32} L${x - s} ${y} L${x - s * 0.32} ${y - s * 0.32} Z`}
      fill={fill}
      stroke={INK}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  );
}

function renderEars(g: PetGenome, body: string, accent: string, cx: number, top: number, dx: number, s: number, tilt: number) {
  if (g.earStyle === 'none') return null;
  const y = top + 8; // base tucks just under the body's top edge
  const ear = (sign: number) => {
    const bx = cx + sign * dx;
    if (g.earStyle === 'pointy') {
      const tipX = bx + sign * (s * 0.2 + tilt);
      return (
        <path key={sign} d={tri(bx - s * 0.5, y, bx + s * 0.5, y, tipX, y - s * 1.5)} fill={body} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      );
    }
    if (g.earStyle === 'floppy') {
      return (
        <path
          key={sign}
          d={`M${bx - s * 0.5} ${y} Q${bx + sign * (s * 0.2 + tilt)} ${y - s * 1.3} ${bx + sign * (s * 0.9)} ${y + s * 0.6} Q${bx + sign * 0.2} ${y + s * 0.3} ${bx + s * 0.5} ${y} Z`}
          fill={body}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      );
    }
    // round
    return <circle key={sign} cx={bx + sign * tilt * 0.3} cy={y - s * 0.5} r={s * 0.85} fill={body} stroke={INK} strokeWidth="4" />;
  };
  const inner = (sign: number) => {
    if (g.earStyle === 'pointy') {
      const bx = cx + sign * dx;
      const tipX = bx + sign * (s * 0.2 + tilt);
      return <path key={`i${sign}`} d={tri(bx - s * 0.25, y - 2, bx + s * 0.25, y - 2, (bx + tipX) / 2, y - s * 1.0)} fill={accent} opacity="0.75" />;
    }
    return null;
  };
  return (
    <>
      {ear(-1)}
      {ear(1)}
      {inner(-1)}
      {inner(1)}
    </>
  );
}

function renderHorns(count: number, accent: string, cx: number, top: number) {
  if (count <= 0) return null;
  const spread = 14;
  const xs = count === 1 ? [cx] : count === 2 ? [cx - spread, cx + spread] : [cx - spread * 1.4, cx, cx + spread * 1.4];
  return (
    <>
      {xs.map((x, i) => (
        <path key={i} d={tri(x - 4, top + 6, x + 4, top + 6, x, top - 10)} fill={accent} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      ))}
    </>
  );
}

function renderLegs(body: string, cx: number, legY: number, dx: number, len: number) {
  const w = 16;
  const leg = (sign: number) => (
    <rect key={sign} x={cx + sign * dx - w / 2} y={legY - 2} width={w} height={len + 8} rx={w / 2} fill={body} stroke={INK} strokeWidth="4" />
  );
  return (
    <>
      {leg(-1)}
      {leg(1)}
    </>
  );
}

function renderTail(g: PetGenome, accent: string, cx: number, cy: number, rx: number, ry: number) {
  if (g.tailStyle === 'none') return null;
  const bx = cx - rx * 0.82;
  const by = cy + ry * 0.34;
  if (g.tailStyle === 'puff') {
    return <circle cx={bx - 6} cy={by} r="13" fill={accent} stroke={INK} strokeWidth="4" />;
  }
  if (g.tailStyle === 'spike') {
    return <path d={tri(bx + 4, by - 12, bx + 4, by + 12, bx - 26, by)} fill={accent} stroke={INK} strokeWidth="4" strokeLinejoin="round" />;
  }
  // curl
  return (
    <path
      d={`M${bx + 6} ${by} C${bx - 26} ${by - 6} ${bx - 28} ${by + 28} ${bx - 4} ${by + 24}`}
      fill="none"
      stroke={accent}
      strokeWidth="11"
      strokeLinecap="round"
    />
  );
}

function renderDorsalSpikes(count: number, accent: string, cx: number, cy: number, rx: number, ry: number) {
  if (count <= 0) return null;
  const spikes = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const ang = lerp(-1.25, -0.35, t); // along the upper-right curve, in radians from top
    const px = cx + Math.cos(ang) * rx * 0.98;
    const py = cy + Math.sin(ang) * ry * 0.98;
    const s = 9;
    spikes.push(
      <path
        key={i}
        d={tri(px - s * 0.5, py + s * 0.4, px + s * 0.5, py + s * 0.4, px + s * 0.5, py - s)}
        fill={accent}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />,
    );
  }
  return <>{spikes}</>;
}

function renderPattern(g: PetGenome, accent: string, cx: number, cy: number, rx: number, ry: number) {
  if (g.pattern === 'none') return null;
  if (g.pattern === 'belly') {
    return <ellipse cx={cx} cy={cy + ry * 0.32} rx={rx * 0.52} ry={ry * 0.4} fill="#ffffff" opacity="0.55" />;
  }
  const count = Math.round(lerp(2, 7, g.patternDensity));
  const rng = mulberry32(hashString(g.bodyColor + g.pattern + count));
  if (g.pattern === 'spots') {
    const spots = [];
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const rr = Math.sqrt(rng()) * 0.66;
      spots.push(
        <circle key={i} cx={cx + Math.cos(a) * rx * rr} cy={cy + Math.sin(a) * ry * rr} r={lerp(4, 8, rng())} fill={accent} opacity="0.6" />,
      );
    }
    return <>{spots}</>;
  }
  // stripes: a few horizontal arcs across the body
  const stripes = [];
  for (let i = 0; i < count; i++) {
    const fy = cy - ry * 0.4 + ((i + 1) / (count + 1)) * ry * 0.9;
    const hw = rx * 0.7 * (1 - Math.abs((fy - cy) / ry) * 0.4);
    stripes.push(
      <path key={i} d={`M${cx - hw} ${fy} Q${cx} ${fy + 7} ${cx + hw} ${fy}`} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.55" />,
    );
  }
  return <>{stripes}</>;
}

function renderEyes(g: PetGenome, eyeY: number, dx: number, r: number, mood: PetMood) {
  const cxL = 100 - dx;
  const cxR = 100 + dx;
  if (mood === 'hurt') {
    // squinted ">  <" eyes
    const squint = (x: number, sign: number) => (
      <g key={x}>
        <path d={`M${x - sign * 6} ${eyeY - 5} L${x + sign * 6} ${eyeY} L${x - sign * 6} ${eyeY + 5}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
    return (
      <>
        {squint(cxL, 1)}
        {squint(cxR, -1)}
      </>
    );
  }
  if (g.eyeStyle === 'sleepy') {
    const lid = (x: number) => (
      <path key={x} d={`M${x - r} ${eyeY} Q${x} ${eyeY + r * 0.9} ${x + r} ${eyeY}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    );
    return (
      <>
        {lid(cxL)}
        {lid(cxR)}
      </>
    );
  }
  const eye = (x: number) => (
    <g key={x}>
      <circle cx={x} cy={eyeY} r={r} fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx={x} cy={eyeY + r * 0.16} r={r * 0.5} fill={INK} />
      <circle cx={x - r * 0.28} cy={eyeY - r * 0.28} r={r * 0.18} fill="#fff" />
      {g.eyeStyle === 'sparkle' && <Sparkle x={x + r * 0.4} y={eyeY - r * 0.45} s={r * 0.4} fill="#fff" />}
    </g>
  );
  return (
    <>
      {eye(cxL)}
      {eye(cxR)}
    </>
  );
}

function renderMouth(g: PetGenome, cx: number, y: number, mood: PetMood) {
  if (mood === 'hurt') {
    return <path d={`M${cx - 10} ${y + 2} Q${cx} ${y - 5} ${cx + 10} ${y + 2}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
  }
  if (g.mouthStyle === 'cat') {
    return (
      <path d={`M${cx - 9} ${y} Q${cx - 4.5} ${y + 6} ${cx} ${y} Q${cx + 4.5} ${y + 6} ${cx + 9} ${y}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    );
  }
  if (g.mouthStyle === 'fang') {
    return (
      <>
        <path d={`M${cx - 11} ${y} Q${cx} ${y + 9} ${cx + 11} ${y}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <path d={tri(cx - 7, y + 1, cx - 3, y + 1, cx - 5, y + 6)} fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={tri(cx + 3, y + 1, cx + 7, y + 1, cx + 5, y + 6)} fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      </>
    );
  }
  // smile
  return <path d={`M${cx - 11} ${y} Q${cx} ${y + 10} ${cx + 11} ${y}`} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
}
