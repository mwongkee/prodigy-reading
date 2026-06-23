import { useGame } from '../state/store';
import { STRANDS, PETS, stageName } from '../content';
import { Pet } from '../assets/pets/Pet';
import { QuestionCard } from './QuestionCard';
import { color } from './theme';

/** The core answer-to-attack loop. All difficulty comes from the adaptive
 * engine via the store — this component is pure presentation. */
export function Battle() {
  const region = useGame((s) => s.region);
  const battle = useGame((s) => s.battle);
  const current = useGame((s) => s.current);
  const lastResult = useGame((s) => s.lastResult);
  const petMood = useGame((s) => s.petMood);
  const petStage = useGame((s) => s.petStage);
  const level = useGame((s) => s.level);
  const speciesId = useGame((s) => s.speciesId);
  const answer = useGame((s) => s.answer);
  const next = useGame((s) => s.next);
  const leaveRegion = useGame((s) => s.leaveRegion);

  if (!region || !battle || !current) return null;

  const species = PETS[speciesId];
  const petName = stageName(species, petStage);
  const isFinale = region === 'finale';
  const meta = isFinale ? null : STRANDS[region];
  const regionColor = isFinale ? color('grape') : color(meta!.color);
  const title = isFinale ? '🎭 The Puppet Master' : `${meta!.emoji} ${meta!.region}`;
  const showingResult = lastResult !== null;

  return (
    <div className="battle" style={{ ['--region' as string]: regionColor }}>
      <header className="battle-top">
        <button className="ghost" onClick={leaveRegion}>← Map</button>
        <h2>{title}</h2>
        <span className="lvl">Lv {level}</span>
      </header>

      <div className="arena">
        <div className={`combatant enemy ${battle.enemy.isBoss ? 'boss' : ''}`}>
          <HpBar hp={battle.enemyHp} max={battle.enemy.maxHp} />
          <div className="enemy-sprite">{battle.enemy.emoji}</div>
          <span className="name">
            {battle.enemy.isBoss && <span className="boss-tag">BOSS</span>} {battle.enemy.name}
          </span>
        </div>
        <div className="combatant player">
          <HpBar hp={battle.petHp} max={battle.petMaxHp} good />
          <Pet
            shape={species.shape}
            bodyColor={species.bodyColor}
            accentColor={species.accentColor}
            stage={petStage}
            mood={petMood}
            size={150}
          />
          <span className="name">{petName}</span>
        </div>
      </div>

      <div className="moves-row">
        {species.moves.map((m) => (
          <span key={m.id} className={`move-chip ${m.kind}`}>
            {m.emoji} {m.name}
          </span>
        ))}
      </div>

      {showingResult ? (
        <div className={`result ${lastResult.correctness >= 0.5 ? 'good' : 'soft'}`}>
          <p>{lastResult.message}</p>
          <button className="primary" onClick={next} autoFocus>Continue</button>
        </div>
      ) : (
        <QuestionCard
          question={current}
          disabled={showingResult}
          onAnswer={(resp, hintsUsed) => answer(resp, { hintsUsed })}
        />
      )}
    </div>
  );
}

function HpBar({ hp, max, good }: { hp: number; max: number; good?: boolean }) {
  const pct = Math.max(0, (hp / max) * 100);
  return (
    <div className="hp">
      <div
        className="hp-fill"
        style={{ width: `${pct}%`, background: good ? color('leaf') : color('coral') }}
      />
    </div>
  );
}
