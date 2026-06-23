import { useGame } from '../state/store';
import { SPECIES_LIST, ELEMENTS, ELEMENT_ORDER, TOTAL_FORMS, type PetSpecies } from '../content';
import { Pet } from '../assets/pets/Pet';
import { color } from './theme';

/**
 * Gallery of every pet form, grouped by element. Doubles as the "show me the
 * pets" screen and the active-pet picker. Pets unlock through play (level
 * milestones) — never purchased (see ETHICS.md).
 */
export function PetDen() {
  const level = useGame((s) => s.level);
  const speciesId = useGame((s) => s.speciesId);
  const setSpecies = useGame((s) => s.setSpecies);

  return (
    <div className="den">
      <header className="den-head">
        <h2>Pet Den</h2>
        <p className="muted">
          {TOTAL_FORMS} forms across {SPECIES_LIST.length} species. New friends unlock
          as you level up — earned by playing, never bought.
        </p>
      </header>

      {ELEMENT_ORDER.map((el) => {
        const species = SPECIES_LIST.filter((s) => s.element === el);
        if (species.length === 0) return null;
        const meta = ELEMENTS[el];
        return (
          <section key={el} className="den-element" style={{ ['--region' as string]: color(meta.color) }}>
            <h3>{meta.emoji} {meta.name}</h3>
            <div className="den-rows">
              {species.map((s) => (
                <SpeciesRow
                  key={s.id}
                  species={s}
                  level={level}
                  active={s.id === speciesId}
                  onUse={() => setSpecies(s.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SpeciesRow({
  species,
  level,
  active,
  onUse,
}: {
  species: PetSpecies;
  level: number;
  active: boolean;
  onUse: () => void;
}) {
  const unlocked = level >= species.unlockLevel;
  return (
    <div className={`species-row ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}>
      <div className="forms">
        {species.stages.map((form, i) => (
          <figure key={form.name} className="form">
            <Pet
              art={form.art}
              element={species.element}
              bodyColor={species.bodyColor}
              accentColor={species.accentColor}
              stage={i}
              mood="happy"
              size={84}
            />
            <figcaption>{form.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="species-actions">
        {active ? (
          <span className="badge-active">In use</span>
        ) : unlocked ? (
          <button className="primary small" onClick={onUse}>Use</button>
        ) : (
          <span className="locked-note">🔒 Lv {species.unlockLevel}</span>
        )}
      </div>
    </div>
  );
}
