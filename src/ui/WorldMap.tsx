import { useGame } from '../state/store';
import { STRANDS } from '../content';
import { STRAND_IDS, bandFor } from '../engine/adaptive';
import { Pet } from '../assets/pets/Pet';
import { color } from './theme';

/** Region picker. No grade selection anywhere — kids just choose where to explore. */
export function WorldMap() {
  const enterRegion = useGame((s) => s.enterRegion);
  const learner = useGame((s) => s.learner);
  const petStage = useGame((s) => s.petStage);
  const level = useGame((s) => s.level);

  return (
    <div className="map">
      <header className="map-head">
        <Pet bodyColor="sky" accentColor="sun" stage={petStage} mood="happy" size={96} />
        <div>
          <h1>ReadQuest</h1>
          <p className="sub">Choose a place to explore. Lv {level}</p>
        </div>
      </header>

      <div className="regions">
        {STRAND_IDS.map((id) => {
          const meta = STRANDS[id];
          const band = bandFor(learner.ratings[id]);
          return (
            <button
              key={id}
              className="region-card"
              style={{ ['--region' as string]: color(meta.color) }}
              onClick={() => enterRegion(id)}
            >
              <span className="region-emoji">{meta.emoji}</span>
              <span className="region-name">{meta.region}</span>
              <span className="region-blurb">{meta.blurb}</span>
              <span className="region-band">{band}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
