import { useState } from 'react';
import { useGame } from './state/store';
import { WorldMap } from './ui/WorldMap';
import { Battle } from './ui/Battle';
import { Dashboard } from './dashboard/Dashboard';

type View = 'play' | 'parents';

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
          <button className={view === 'parents' ? 'active' : ''} onClick={() => setView('parents')}>
            For Parents
          </button>
        </div>
      </nav>

      <main>
        {view === 'parents' ? <Dashboard /> : region ? <Battle /> : <WorldMap />}
      </main>
    </div>
  );
}
