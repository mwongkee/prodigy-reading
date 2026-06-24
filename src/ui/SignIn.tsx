import { useState } from 'react';
import { useGame } from '../state/store';
import { MIN_PASSWORD_LENGTH } from '../auth';

/**
 * Username + password modal for cloud sync. Two modes:
 *   - `signin` — kid-facing; a kid signs in to sync their progress across devices.
 *   - `create` — parent-gated upstream; a grown-up creates a kid's synced login.
 *
 * Works in offline mode too (local auth provider), so it never dead-ends even
 * before the Cognito backend is provisioned.
 */
export function SignIn({ mode, onClose }: { mode: 'signin' | 'create'; onClose: () => void }) {
  const signIn = useGame((s) => s.signIn);
  const signUp = useGame((s) => s.signUp);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const creating = mode === 'create';
  const canSubmit = username.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const res = creating
      ? await signUp(username, password, username)
      : await signIn(username, password);
    setBusy(false);
    if (res.ok) onClose();
    else setError(res.message);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{creating ? 'Create a synced login ☁️' : 'Sign in ☁️'}</h3>
        <p className="muted">
          {creating
            ? 'Pick a username and password for this player so their pets and progress sync across devices.'
            : 'Sign in to load your pets and progress on this device.'}
        </p>
        <form className="gate-form" onSubmit={submit}>
          <label>
            Username
            <input
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              aria-label="Username"
              maxLength={24}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              aria-label="Password"
            />
          </label>
          {creating && password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
            <p className="muted small">At least {MIN_PASSWORD_LENGTH} characters.</p>
          )}
          {error && <p className="gate-wrong">{error}</p>}
          <div className="gate-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary small" disabled={!canSubmit}>
              {busy ? '…' : creating ? 'Create' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
