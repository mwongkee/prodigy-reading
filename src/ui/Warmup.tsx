import { useEffect, useState } from 'react';
import { useGame, resolveSpecies } from '../state/store';
import { formAt } from '../content';
import { Pet } from '../assets/pets/Pet';
import { QuestionCard } from './QuestionCard';
import { color } from './theme';

/**
 * First-launch placement warm-up. A short, pressure-free ladder of questions
 * that calibrates the starting difficulty from how the child plays — we never
 * ask their grade (ETHICS.md #4). Correctness is never shown here, so it reads
 * as play, not a test.
 */
export function Warmup() {
  const placement = useGame((s) => s.placement);
  const beginPlacement = useGame((s) => s.beginPlacement);
  const answerPlacement = useGame((s) => s.answerPlacement);
  const skipPlacement = useGame((s) => s.skipPlacement);
  const speciesId = useGame((s) => s.speciesId);
  const customPets = useGame((s) => s.customPets);

  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started && !placement) beginPlacement();
  }, [started, placement, beginPlacement]);

  const species = resolveSpecies(speciesId, customPets);
  const form = formAt(species, 0);
  const regionColor = color(species.element === 'frost' ? 'sky' : 'grape');

  return (
    <div className="app">
      <div className="warmup" style={{ ['--region' as string]: regionColor }}>
        <div className="warmup-pet">
          <Pet
            art={form.art}
            element={species.element}
            bodyColor={species.bodyColor}
            accentColor={species.accentColor}
            stage={0}
            mood="happy"
            size={132}
          />
        </div>

        {!started ? (
          <div className="warmup-intro">
            <h2>Let's warm up! ✨</h2>
            <p>
              Play a few quick questions so {form.name} knows where to start.
              There are no wrong answers here — just have fun!
            </p>
            <button className="primary" onClick={() => setStarted(true)} autoFocus>
              Start warm-up
            </button>
            <button className="ghost" onClick={skipPlacement}>
              Skip for now
            </button>
          </div>
        ) : !placement ? null : (
          <div className="warmup-play">
            <div className="warmup-progress" aria-label="Warm-up progress">
              {placement.ladder.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i < placement.index ? 'done' : i === placement.index ? 'current' : ''}`}
                />
              ))}
            </div>
            <p className="warmup-count">
              Question {placement.index + 1} of {placement.ladder.length}
            </p>
            <QuestionCard
              key={placement.ladder[placement.index].id}
              question={placement.ladder[placement.index]}
              disabled={false}
              onAnswer={(resp) => answerPlacement(resp)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
