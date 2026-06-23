import { useState } from 'react';
import { useGame } from './state/store';
import { WorldMap } from './ui/WorldMap';
import { Battle } from './ui/Battle';
import { PetDen } from './ui/PetDen';
import { Dashboard } from './dashboard/Dashboard';

type View = 'play' | 'pets' | 'parents';

export default function App() {
  const [view, setView] = useState<View>('play');
  const region = useGame((s) => s.region);

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
        ) : region ? (
          <Battle />
        ) : (
          <WorldMap />
        )}
      </main>
    </div>
  );
}
