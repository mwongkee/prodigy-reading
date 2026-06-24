import { useState } from 'react';
import { useGame } from './state/store';
import { WorldMap } from './ui/WorldMap';
import { Battle } from './ui/Battle';
import { PetDen } from './ui/PetDen';
import { DrawAlong } from './ui/DrawAlong';
import { PetWorkshop } from './ui/PetWorkshop';
import { Warmup } from './ui/Warmup';
import { Dashboard } from './dashboard/Dashboard';

type View = 'play' | 'pets' | 'create' | 'draw' | 'parents';

export default function App() {
  const [view, setView] = useState<View>('play');
  const region = useGame((s) => s.region);
  const placed = useGame((s) => s.placed);

  // First launch: calibrate difficulty through a short warm-up before the game.
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
