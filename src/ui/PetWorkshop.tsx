import { useState } from 'react';
import { useGame } from '../state/store';
import {
  genomeFromSeed,
  randomGenome,
  buildCustomSpecies,
  ELEMENT_PALETTE,
  BODY_SHAPES,
  EAR_STYLES,
  EYE_STYLES,
  MOUTH_STYLES,
  TAIL_STYLES,
  PATTERNS,
  ELEMENTS,
  ELEMENT_ORDER,
  type PetGenome,
  type ElementId,
} from '../content';
import { mulberry32, hashString } from '../engine/rng';
import { Pet } from '../assets/pets/Pet';
import { COLORS, color } from './theme';
import type { PetMood } from '../assets/pets/Pet';

/** Friendly labels for the continuous knobs (order = display order). */
const SLIDERS: { key: keyof PetGenome; label: string }[] = [
  { key: 'bodyW', label: 'Body width' },
  { key: 'bodyH', label: 'Body height' },
  { key: 'eyeSize', label: 'Eye size' },
  { key: 'eyeSpacing', label: 'Eye spacing' },
  { key: 'earSize', label: 'Ear size' },
  { key: 'earAngle', label: 'Ear angle' },
  { key: 'legLength', label: 'Leg length' },
  { key: 'hornCount', label: 'Horns' },
  { key: 'spikeAmount', label: 'Back spikes' },
  { key: 'patternDensity', label: 'Pattern amount' },
];

const TOGGLES: { key: keyof PetGenome; label: string; options: readonly string[] }[] = [
  { key: 'bodyShape', label: 'Body', options: BODY_SHAPES },
  { key: 'earStyle', label: 'Ears', options: EAR_STYLES },
  { key: 'eyeStyle', label: 'Eyes', options: EYE_STYLES },
  { key: 'mouthStyle', label: 'Mouth', options: MOUTH_STYLES },
  { key: 'tailStyle', label: 'Tail', options: TAIL_STYLES },
  { key: 'pattern', label: 'Pattern', options: PATTERNS },
];

const SWATCHES = [COLORS.coral, COLORS.sun, COLORS.leaf, COLORS.sea, COLORS.sky, COLORS.grape, '#ff9ecf', '#fff3c4', COLORS.ink];
const STAGE_NAMES = ['Baby', 'Teen', 'Grown'];

/**
 * The Pet Workshop: kids build their own playable creature parametrically —
 * style toggles + sliders + "Surprise me" (random seed) + name-as-seed. Output
 * is a polished SVG via the Creature rig (no AI). Saving it makes a real,
 * persisted battle pet (see store.addCustomPet). On-ethos: free, earned by play.
 */
export function PetWorkshop() {
  const addCustomPet = useGame((s) => s.addCustomPet);
  const [genome, setGenome] = useState<PetGenome>(() => genomeFromSeed('ReadQuest'));
  const [name, setName] = useState('');
  const [stage, setStage] = useState(0);
  const [mood, setMood] = useState<PetMood>('happy');
  const [saved, setSaved] = useState<string | null>(null);

  const region = color(ELEMENTS[genome.element].color);

  function patch(p: Partial<PetGenome>) {
    setGenome((g) => ({ ...g, ...p }));
    setSaved(null);
  }

  function surprise() {
    setGenome(randomGenome(mulberry32((Math.random() * 2 ** 31) | 0)));
    setSaved(null);
  }

  function fromName() {
    if (name.trim()) {
      setGenome(genomeFromSeed(name.trim()));
      setSaved(null);
    }
  }

  function pickElement(el: ElementId) {
    // Re-theme to the element's palette so the change reads clearly.
    patch({ element: el, ...ELEMENT_PALETTE[el] });
  }

  function save() {
    const id = `custom-${(Date.now() * 1000 + (hashString(name) % 1000)).toString(36)}`;
    const species = buildCustomSpecies(genome, name, id);
    addCustomPet(species);
    setSaved(species.stages[0].name);
  }

  return (
    <div className="workshop" style={{ ['--region' as string]: region }}>
      <header className="den-head">
        <h2>Pet Workshop</h2>
        <p className="muted">
          Build your very own pet! Slide, tap, and hit <strong>Surprise me</strong> until it's
          just right — then name it and it joins your team. Made by you, no two alike.
        </p>
      </header>

      <div className="ws-grid">
        {/* preview */}
        <div className="ws-preview">
          <div className="ws-stage">
            <Pet art={{ kind: 'genome', genome }} element={genome.element} stage={stage} mood={mood} size={220} />
          </div>
          <div className="ws-preview-controls">
            <div className="seg">
              {STAGE_NAMES.map((s, i) => (
                <button key={s} className={stage === i ? 'on' : ''} onClick={() => setStage(i)}>
                  {s}
                </button>
              ))}
            </div>
            <div className="seg">
              {(['idle', 'happy', 'attack', 'hurt'] as PetMood[]).map((m) => (
                <button key={m} className={mood === m ? 'on' : ''} onClick={() => setMood(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button className="primary ws-surprise" onClick={surprise}>
            🎲 Surprise me
          </button>
        </div>

        {/* controls */}
        <div className="ws-controls">
          <section className="ws-card">
            <label className="ws-field">
              <span>Pet name</span>
              <div className="ws-name-row">
                <input
                  type="text"
                  value={name}
                  placeholder="e.g. Sparky"
                  maxLength={16}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(null);
                  }}
                />
                <button className="ghost small" onClick={fromName} disabled={!name.trim()} title="Make a pet from the name">
                  ✨ From name
                </button>
              </div>
            </label>
          </section>

          <section className="ws-card">
            <h3>Element</h3>
            <div className="ws-chips">
              {ELEMENT_ORDER.map((el) => (
                <button
                  key={el}
                  className={`ws-chip ${genome.element === el ? 'on' : ''}`}
                  style={{ ['--region' as string]: color(ELEMENTS[el].color) }}
                  onClick={() => pickElement(el)}
                >
                  {ELEMENTS[el].emoji} {ELEMENTS[el].name}
                </button>
              ))}
            </div>
          </section>

          <section className="ws-card">
            <h3>Colours</h3>
            <ColorRow label="Body" value={genome.bodyColor} onChange={(c) => patch({ bodyColor: c })} />
            <ColorRow label="Accent" value={genome.accentColor} onChange={(c) => patch({ accentColor: c })} />
          </section>

          <section className="ws-card">
            <h3>Shape</h3>
            {TOGGLES.map((t) => (
              <div key={t.key} className="ws-toggle">
                <span className="ws-toggle-label">{t.label}</span>
                <div className="seg wrap">
                  {t.options.map((opt) => (
                    <button
                      key={opt}
                      className={genome[t.key] === opt ? 'on' : ''}
                      onClick={() => patch({ [t.key]: opt } as Partial<PetGenome>)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="ws-card">
            <h3>Fine-tune</h3>
            {SLIDERS.map((s) => (
              <label key={s.key} className="ws-slider">
                <span>{s.label}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={genome[s.key] as number}
                  onChange={(e) => patch({ [s.key]: Number(e.target.value) } as Partial<PetGenome>)}
                />
              </label>
            ))}
          </section>

          <div className="ws-save">
            <button className="primary" onClick={save}>
              💾 Save my pet
            </button>
            {saved && <span className="ws-saved">🎉 {saved} joined your team! Find it in the Pet Den.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="ws-color">
      <span className="ws-toggle-label">{label}</span>
      <div className="ws-swatches">
        {SWATCHES.map((c) => (
          <button
            key={c}
            className={`ws-swatch ${value.toLowerCase() === c.toLowerCase() ? 'on' : ''}`}
            style={{ background: c }}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
          />
        ))}
        <input className="ws-color-input" type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} custom colour`} />
      </div>
    </div>
  );
}
