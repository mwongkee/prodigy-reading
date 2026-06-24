import { useMemo, useState } from 'react';

/**
 * Lightweight "ask a grown-up" gate for actions that create or remove a child
 * profile (ETHICS.md #3 & #6: account management is parent-gated). A 2-digit ×
 * 1-digit multiplication is trivial for an adult and a speed bump for the 6-11
 * target age — not real auth, just intent confirmation.
 */
export function ParentGate({
  prompt,
  onPass,
  onCancel,
}: {
  prompt: string;
  onPass: () => void;
  onCancel: () => void;
}) {
  const [a, b] = useMemo(
    () => [12 + Math.floor(Math.random() * 8), 3 + Math.floor(Math.random() * 6)],
    [],
  );
  const [val, setVal] = useState('');
  const [wrong, setWrong] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(val) === a * b) onPass();
    else {
      setWrong(true);
      setVal('');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Ask a grown-up 🧑‍🦰</h3>
        <p className="muted">{prompt}</p>
        <form className="gate-form" onSubmit={submit}>
          <label>
            What is <strong>{a} × {b}</strong>?
            <input
              autoFocus
              inputMode="numeric"
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                setWrong(false);
              }}
              aria-label="Answer"
            />
          </label>
          {wrong && <p className="gate-wrong">Not quite — try again.</p>}
          <div className="gate-actions">
            <button type="button" className="ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary small" disabled={!val.trim()}>
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
