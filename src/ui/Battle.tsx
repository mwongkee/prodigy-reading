import { useGame } from '../state/store';
import { STRANDS } from '../content';
import { Pet } from '../assets/pets/Pet';
import { QuestionCard } from './QuestionCard';
import { color } from './theme';

/** The core answer-to-attack loop. Everything difficulty-related comes from the
 * adaptive engine via the store — this component is pure presentation. */
export function Battle() {
  const region = useGame((s) => s.region);
  const battle = useGame((s) => s.battle);
  const current = useGame((s) => s.current);
  const lastResult = useGame((s) => s.lastResult);
  const petMood = useGame((s) => s.petMood);
  const petStage = useGame((s) => s.petStage);
  const level = useGame((s) => s.level);
  const answer = useGame((s) => s.answer);
  const next = useGame((s) => s.next);
  const leaveRegion = useGame((s) => s.leaveRegion);

  if (!region || !battle || !current) return null;
  const meta = STRANDS[region];
  const showingResult = lastResult !== null;

  return (
    <div className="battle" style={{ ['--region' as string]: color(meta.color) }}>
      <header className="battle-top">
        <button className="ghost" onClick={leaveRegion}>← Map</button>
        <h2>{meta.emoji} {meta.region}</h2>
        <span className="lvl">Lv {level}</span>
      </header>

      <div className="arena">
        <div className="combatant enemy">
          <HpBar hp={battle.enemyHp} max={battle.enemyMaxHp} />
          <div className="enemy-sprite">👾</div>
          <span className="name">{battle.enemyName}</span>
        </div>
        <div className="combatant player">
          <HpBar hp={battle.petHp} max={battle.petMaxHp} good />
          <Pet bodyColor={meta.color} accentColor="sun" stage={petStage} mood={petMood} size={140} />
          <span className="name">Your Pet</span>
        </div>
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
