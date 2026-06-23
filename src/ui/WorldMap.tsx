import { useGame } from '../state/store';
import { STRANDS, PETS, stageName, REGION_BOSSES, KEYSTONES, ALL_KEYSTONE_IDS, MINIONS_BEFORE_BOSS } from '../content';
import { STRAND_IDS, bandFor } from '../engine/adaptive';
import { Pet } from '../assets/pets/Pet';
import { color } from './theme';

/** Region picker. No grade selection anywhere — kids just choose where to explore. */
export function WorldMap() {
  const enterRegion = useGame((s) => s.enterRegion);
  const learner = useGame((s) => s.learner);
  const petStage = useGame((s) => s.petStage);
  const level = useGame((s) => s.level);
  const speciesId = useGame((s) => s.speciesId);
  const progress = useGame((s) => s.progress);
  const bossDefeated = useGame((s) => s.bossDefeated);
  const keystones = useGame((s) => s.keystones);
  const finaleWon = useGame((s) => s.finaleWon);

  const species = PETS[speciesId];
  const haveAllKeystones = ALL_KEYSTONE_IDS.every((k) => keystones.includes(k));

  return (
    <div className="map">
      <header className="map-head">
        <Pet shape={species.shape} bodyColor={species.bodyColor} accentColor={species.accentColor}
          stage={petStage} mood="happy" size={104} />
        <div>
          <h1>ReadQuest</h1>
          <p className="sub">{stageName(species, petStage)} · Lv {level}</p>
        </div>
      </header>

      {/* Keystone tracker */}
      <div className="keystone-bar">
        <span className="ks-label">Keystones</span>
        {ALL_KEYSTONE_IDS.map((id) => (
          <span key={id} className={`ks ${keystones.includes(id) ? 'have' : ''}`} title={KEYSTONES[id].name}>
            {keystones.includes(id) ? KEYSTONES[id].emoji : '·'}
          </span>
        ))}
        <span className="ks-count">{keystones.length}/{ALL_KEYSTONE_IDS.length}</span>
      </div>

      <div className="regions">
        {STRAND_IDS.map((id) => {
          const meta = STRANDS[id];
          const band = bandFor(learner.ratings[id]);
          const boss = REGION_BOSSES[id];
          const beaten = bossDefeated[id];
          const toBoss = Math.min(progress[id], MINIONS_BEFORE_BOSS);
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
              <span className="region-foot">
                <span className="region-band">{band}</span>
                <span className="boss-line">
                  {beaten ? `✅ ${boss.name}` : `${boss.emoji} ${boss.name} ${toBoss}/${MINIONS_BEFORE_BOSS}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Puppet Master finale */}
      <button
        className={`finale-card ${haveAllKeystones ? '' : 'locked'}`}
        disabled={!haveAllKeystones}
        onClick={() => enterRegion('finale')}
      >
        <span className="region-emoji">🎭</span>
        <span className="region-name">The Puppet Master</span>
        <span className="region-blurb">
          {finaleWon
            ? 'Freed! You can challenge him again any time.'
            : haveAllKeystones
              ? 'All Keystones gathered — break his spell over the pets!'
              : `Collect all ${ALL_KEYSTONE_IDS.length} Keystones to face the one pulling the strings.`}
        </span>
      </button>
    </div>
  );
}
