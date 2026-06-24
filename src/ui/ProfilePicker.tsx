import { useState } from 'react';
import { useGame, resolveSpecies } from '../state/store';
import { formAt } from '../content';
import { Pet } from '../assets/pets/Pet';
import { ParentGate } from './ParentGate';
import { SignIn } from './SignIn';

/**
 * Player picker / household home. Choosing a player is kid-facing and open;
 * adding, renaming, and removing players is parent-gated (ETHICS.md #3/#6).
 */
export function ProfilePicker() {
  const profiles = useGame((s) => s.profiles);
  const activeProfileId = useGame((s) => s.activeProfileId);
  const createProfile = useGame((s) => s.createProfile);
  const selectProfile = useGame((s) => s.selectProfile);
  const deleteProfile = useGame((s) => s.deleteProfile);
  const renameProfile = useGame((s) => s.renameProfile);
  const closePicker = useGame((s) => s.closePicker);
  const session = useGame((s) => s.session);
  const signOut = useGame((s) => s.signOut);

  const [gate, setGate] = useState<null | 'add' | 'manage' | 'login'>(null);
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [auth, setAuth] = useState<null | 'signin' | 'create'>(null);
  const [name, setName] = useState('');

  function passGate() {
    if (gate === 'add') setAdding(true);
    if (gate === 'manage') setManaging(true);
    if (gate === 'login') setAuth('create');
    setGate(null);
  }

  function create() {
    const clean = name.trim();
    if (!clean) return;
    createProfile(clean);
    setName('');
    setAdding(false);
  }

  return (
    <div className="app">
      <div className="picker">
        <h1 className="picker-title">📖 ReadQuest</h1>
        <p className="picker-sub">Who's playing today?</p>

        <div className="picker-grid">
          {profiles.map((p) => {
            const species = resolveSpecies(p.speciesId, []);
            const form = formAt(species, 0);
            return (
              <div key={p.id} className="profile-card">
                <button
                  className="profile-pick"
                  onClick={() => selectProfile(p.id)}
                  aria-label={`Play as ${p.name}`}
                >
                  <Pet
                    art={form.art}
                    element={species.element}
                    bodyColor={species.bodyColor}
                    accentColor={species.accentColor}
                    stage={0}
                    mood="happy"
                    size={92}
                  />
                  <span className="profile-name">{p.name}</span>
                </button>
                {managing && (
                  <div className="profile-manage">
                    <button
                      className="ghost tiny"
                      onClick={() => {
                        const next = window.prompt(`Rename ${p.name} to:`, p.name);
                        if (next) renameProfile(p.id, next);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="ghost tiny danger"
                      onClick={() => {
                        if (window.confirm(`Remove ${p.name}? This deletes their progress.`)) {
                          deleteProfile(p.id);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {adding ? (
            <form
              className="profile-card profile-add-form"
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New player's name"
                aria-label="New player's name"
                maxLength={16}
              />
              <div className="gate-actions">
                <button type="button" className="ghost tiny" onClick={() => { setAdding(false); setName(''); }}>
                  Cancel
                </button>
                <button type="submit" className="primary small" disabled={!name.trim()}>
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button className="profile-card profile-add" onClick={() => setGate('add')}>
              <span className="plus">＋</span>
              <span className="profile-name">Add player</span>
            </button>
          )}
        </div>

        <div className="picker-foot">
          {profiles.length > 0 && (
            <button className="ghost" onClick={() => (managing ? setManaging(false) : setGate('manage'))}>
              {managing ? 'Done' : 'Manage players'}
            </button>
          )}
          {activeProfileId && !managing && (
            <button className="ghost" onClick={closePicker}>
              ← Back to game
            </button>
          )}
        </div>

        <div className="picker-sync">
          {session ? (
            <span className="muted small">
              ☁️ Synced as <strong>{session.username}</strong>
              <button className="link" onClick={() => void signOut()}>
                Sign out
              </button>
            </span>
          ) : (
            <span className="muted small">
              <button className="link" onClick={() => setAuth('signin')}>
                Sign in to sync
              </button>
              {' · '}
              <button className="link" onClick={() => setGate('login')}>
                Create a synced login
              </button>
            </span>
          )}
        </div>
      </div>

      {gate && (
        <ParentGate
          prompt={
            gate === 'add'
              ? 'Adding a new player is a grown-up step.'
              : gate === 'login'
                ? 'Creating a synced login is a grown-up step.'
                : 'Managing players is a grown-up step.'
          }
          onPass={passGate}
          onCancel={() => setGate(null)}
        />
      )}

      {auth && <SignIn mode={auth} onClose={() => setAuth(null)} />}
    </div>
  );
}
