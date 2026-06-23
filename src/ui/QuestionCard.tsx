import { useMemo, useState } from 'react';
import type { Question } from '../content';

interface Props {
  question: Question;
  disabled: boolean;
  onAnswer: (response: unknown, hintsUsed: number) => void;
}

/** Renders the input for whichever question type is active and reports answers. */
export function QuestionCard({ question, disabled, onAnswer }: Props) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);

  function useHint() {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed((h) => h + 1);
    }
  }

  return (
    <div className="question-card" key={question.id}>
      <p className="prompt">{question.prompt}</p>

      {question.type === 'multiple-choice' && (
        <MultipleChoice q={question} disabled={disabled} onPick={(i) => onAnswer(i, hintsUsed)} />
      )}
      {question.type === 'spelling' && (
        <Spelling disabled={disabled} onSubmit={(t) => onAnswer(t, hintsUsed)} />
      )}
      {question.type === 'word-order' && (
        <WordOrder q={question} disabled={disabled} onSubmit={(t) => onAnswer(t, hintsUsed)} />
      )}

      {question.hint && !disabled && (
        <div className="hint-row">
          {showHint ? (
            <p className="hint">💡 {question.hint}</p>
          ) : (
            <button className="ghost" onClick={useHint}>
              Need a hint?
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MultipleChoice({
  q,
  disabled,
  onPick,
}: {
  q: Extract<Question, { type: 'multiple-choice' }>;
  disabled: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div className="choices">
      {q.choices.map((c, i) => (
        <button key={i} className="choice" disabled={disabled} onClick={() => onPick(i)}>
          {c}
        </button>
      ))}
    </div>
  );
}

function Spelling({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');
  return (
    <form
      className="spelling"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text);
      }}
    >
      <input
        autoFocus
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type the word…"
        aria-label="Your answer"
      />
      <button className="primary" type="submit" disabled={disabled || !text.trim()}>
        Cast!
      </button>
    </form>
  );
}

function WordOrder({
  q,
  disabled,
  onSubmit,
}: {
  q: Extract<Question, { type: 'word-order' }>;
  disabled: boolean;
  onSubmit: (tokens: string[]) => void;
}) {
  // Stable shuffle per question instance.
  const shuffled = useMemo(() => shuffle(q.answer), [q.id]);
  const [bank, setBank] = useState<string[]>(shuffled);
  const [line, setLine] = useState<string[]>([]);

  function place(i: number) {
    if (disabled) return;
    setLine((l) => [...l, bank[i]]);
    setBank((b) => b.filter((_, idx) => idx !== i));
  }
  function unplace(i: number) {
    if (disabled) return;
    setBank((b) => [...b, line[i]]);
    setLine((l) => l.filter((_, idx) => idx !== i));
  }

  return (
    <div className="word-order">
      <div className="sentence-line" aria-label="Your sentence">
        {line.length === 0 && <span className="placeholder">Tap words to build the sentence…</span>}
        {line.map((w, i) => (
          <button key={`${w}-${i}`} className="tile placed" disabled={disabled} onClick={() => unplace(i)}>
            {w}
          </button>
        ))}
      </div>
      <div className="tile-bank">
        {bank.map((w, i) => (
          <button key={`${w}-${i}`} className="tile" disabled={disabled} onClick={() => place(i)}>
            {w}
          </button>
        ))}
      </div>
      <button
        className="primary"
        disabled={disabled || bank.length > 0}
        onClick={() => onSubmit(line)}
      >
        Cast!
      </button>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // guard against the (rare) already-sorted shuffle
  if (a.every((v, i) => v === arr[i]) && a.length > 1) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}
