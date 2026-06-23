import { useMemo, useState } from 'react';
import { useGame } from '../state/store';
import {
  DRAW_TUTORIALS,
  TOOL_INFO,
  tutorialFor,
  PETS,
  ELEMENTS,
  formAt,
  type DrawPrimitive,
  type DrawTutorial,
} from '../content';
import { Pet } from '../assets/pets/Pet';
import { color } from './theme';

const EXCALIDRAW_URL = 'https://excalidraw.com';

/**
 * Draw-Along: pick a starter pet and follow click-by-click steps to draw it in
 * Excalidraw (a free, no-login browser tool). The diagram builds up shape by
 * shape so kids can copy each step. Drawing is open to everyone — a creativity
 * activity, never gated. Steps mirror docs/draw-along.md.
 */
export function DrawAlong() {
  const speciesId = useGame((s) => s.speciesId);
  const initial = tutorialFor(speciesId) ? speciesId : 'luminex';
  const [petId, setPetId] = useState(initial);
  const [step, setStep] = useState(0);
  const [showFinished, setShowFinished] = useState(false);

  const tutorial = tutorialFor(petId) ?? DRAW_TUTORIALS[0];
  const meta = ELEMENTS[tutorial.element];
  const region = color(meta.color);

  function pick(id: string) {
    setPetId(id);
    setStep(0);
    setShowFinished(false);
  }

  return (
    <div className="draw-along" style={{ ['--region' as string]: region }}>
      <header className="den-head">
        <h2>Draw-Along</h2>
        <p className="muted">
          Pick a pet and follow the steps to draw it yourself in{' '}
          <a href={EXCALIDRAW_URL} target="_blank" rel="noreferrer">
            Excalidraw
          </a>{' '}
          — a free drawing tool. Reading the steps in order is part of the fun!
        </p>
      </header>

      <div className="draw-pets">
        {DRAW_TUTORIALS.map((t) => {
          const m = ELEMENTS[t.element];
          const name = PETS[t.petId].stages[0].name;
          return (
            <button
              key={t.petId}
              className={`draw-chip ${t.petId === petId ? 'active' : ''}`}
              style={{ ['--region' as string]: color(m.color) }}
              onClick={() => pick(t.petId)}
            >
              {m.emoji} {name}
            </button>
          );
        })}
      </div>

      <Stage tutorial={tutorial} step={step} showFinished={showFinished} region={region} />

      <StepCard tutorial={tutorial} step={step} />

      <div className="draw-controls">
        <button className="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ← Back
        </button>
        <span className="muted small">
          Step {step + 1} of {tutorial.steps.length}
        </span>
        <button
          className="primary small"
          onClick={() => setStep((s) => Math.min(tutorial.steps.length - 1, s + 1))}
          disabled={step === tutorial.steps.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="draw-foot">
        <button className="ghost" onClick={() => { setStep(0); setShowFinished(false); }}>
          ↺ Start over
        </button>
        <button className="ghost" onClick={() => setShowFinished((v) => !v)}>
          {showFinished ? 'Back to steps' : '👀 See finished pet'}
        </button>
        <a className="primary small" href={EXCALIDRAW_URL} target="_blank" rel="noreferrer">
          Open Excalidraw ↗
        </a>
      </div>
    </div>
  );
}

function Stage({
  tutorial,
  step,
  showFinished,
  region,
}: {
  tutorial: DrawTutorial;
  step: number;
  showFinished: boolean;
  region: string;
}) {
  if (showFinished) {
    const species = PETS[tutorial.petId];
    return (
      <div className="draw-stage">
        <Pet
          art={formAt(species, 0).art}
          element={species.element}
          bodyColor={species.bodyColor}
          accentColor={species.accentColor}
          stage={0}
          mood="happy"
          size={220}
        />
      </div>
    );
  }
  return (
    <div className="draw-stage">
      <svg className="draw-canvas" viewBox="0 0 100 100" role="img" aria-label={`${tutorial.title}, step ${step + 1}`}>
        {tutorial.steps.slice(0, step + 1).map((s, si) =>
          s.shapes.map((shape, i) => (
            <Primitive key={`${si}-${i}`} shape={shape} highlight={si === step} region={region} />
          )),
        )}
      </svg>
    </div>
  );
}

function Primitive({
  shape,
  highlight,
  region,
}: {
  shape: DrawPrimitive;
  highlight: boolean;
  region: string;
}) {
  const baseStroke = shape.stroke ?? 'ink';
  const noStroke = baseStroke === 'none';
  const stroke = noStroke ? 'none' : highlight ? region : color(baseStroke);
  const strokeWidth = noStroke ? 0 : highlight ? 2.4 : 1.4;
  const fill = shape.fill ? color(shape.fill) : 'none';
  const common = { fill, stroke, strokeWidth, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

  if (shape.s === 'ellipse') {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  }
  if (shape.s === 'rect') {
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r ?? 0} {...common} />;
  }
  const pts = shape.points.map(([x, y]) => `${x},${y}`).join(' ');
  if (shape.closed) {
    return <polygon points={pts} {...common} />;
  }
  return <polyline points={pts} {...common} fill="none" />;
}

function StepCard({ tutorial, step }: { tutorial: DrawTutorial; step: number }) {
  const s = tutorial.steps[step];
  const tool = TOOL_INFO[s.tool];
  const badge = useMemo(
    () => (tool.key ? `${tool.name} — press ${tool.key}` : tool.name),
    [tool],
  );
  return (
    <div className="draw-step-card">
      <span className="tool-badge">
        {tool.emoji} {badge}
      </span>
      <p className="draw-say">{s.say}</p>
      {s.tip && <p className="draw-tip">💡 {s.tip}</p>}
    </div>
  );
}
