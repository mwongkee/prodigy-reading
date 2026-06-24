import { useState } from 'react';
import { useGame } from './state/store';
import { WorldMap } from './ui/WorldMap';
import { Battle } from './ui/Battle';
import { PetDen } from './ui/PetDen';
import { DrawAlong } from './ui/DrawAlong';
import { PetWorkshop } from './ui/PetWorkshop';
import { Warmup } from './ui/Warmup';
import { ProfilePicker } from './ui/ProfilePicker';
import { Dashboard } from './dashboard/Dashboard';

type View = 'play' | 'pets' | 'create' | 'draw' | 'parents';

export default function App() {
  const [view, setView] = useState<View>('play');
  const region = useGame((s) => s.region);
  const placed = useGame((s) => s.placed);
  const activeProfileId = useGame((s) => s.activeProfileId);
  const showPicker = useGame((s) => s.showPicker);
  const activeName = useGame(
    (s) => s.profiles.find((p) => p.id === s.activeProfileId)?.name,
  );
  const openPicker = useGame((s) => s.openPicker);

  // No active player (first run or all removed) or an explicit switch: pick first.
  if (!activeProfileId || showPicker) return <ProfilePicker />;

  // New player: calibrate difficulty through a short warm-up before the game.
  if (!placed) return <Warmup />;

  return (
    <div className="app">
      <nav className="topnav">
        <span className="brand">📖 ReadQuest</span>
        <div className="tabs">
          <button className={view === 'play' ? 'active' : ''} onClick={() => setView('play')}>
            Play
          </button>
          <button className={view === 'pets' ? 'active' : ''} onClick={() => setView('pets')}>
            Pets
          </button>
          <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>
            Create
          </button>
          <button className={view === 'draw' ? 'active' : ''} onClick={() => setView('draw')}>
            Draw
          </button>
          <button className={view === 'parents' ? 'active' : ''} onClick={() => setView('parents')}>
            For Parents
          </button>
          <button className="who" onClick={openPicker} title="Switch player">
            👤 {activeName ?? 'Player'}
          </button>
        </div>
      </nav>

      <main>
        {view === 'parents' ? (
          <Dashboard />
        ) : view === 'pets' ? (
          <PetDen />
        ) : view === 'create' ? (
          <PetWorkshop />
        ) : view === 'draw' ? (
          <DrawAlong />
        ) : region ? (
          <Battle />
        ) : (
          <WorldMap />
        )}
      </main>
    </div>
  );
}
