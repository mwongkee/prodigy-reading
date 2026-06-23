import { useGame } from '../state/store';
import { STRANDS } from '../content';
import { STRAND_IDS, bandFor, focusOrder } from '../engine/adaptive';
import { color } from '../ui/theme';

/**
 * Parent-facing report. Shows per-strand level bands, accuracy, and a
 * supportive focus suggestion. Framed as growth — never "behind"/"below grade"
 * (see ETHICS.md §4). In production this lives behind a parent-gated account.
 */
export function Dashboard() {
  const learner = useGame((s) => s.learner);
  const log = useGame((s) => s.log);

  const totalAttempts = log.length;
  const order = focusOrder(learner);
  const focus = order.find((id) => learner.stats[id].attempts > 0);

  return (
    <div className="dashboard">
      <h2>Parent Dashboard</h2>
      <p className="muted">
        A supportive snapshot of where your child is growing. We adapt to their
        level automatically — there are no grades to pick and no “behind”.
      </p>

      {totalAttempts === 0 ? (
        <p className="muted">No play yet this session. Explore a region to see progress here.</p>
      ) : (
        <>
          {focus && (
            <div className="focus-callout" style={{ ['--region' as string]: color(STRANDS[focus].color) }}>
              <strong>Suggested focus:</strong> {STRANDS[focus].region} —{' '}
              {STRANDS[focus].blurb}
            </div>
          )}

          <table className="strand-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Level</th>
                <th>Questions</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {STRAND_IDS.map((id) => {
                const st = learner.stats[id];
                const acc = st.attempts ? Math.round((st.correct / st.attempts) * 100) : null;
                return (
                  <tr key={id}>
                    <td>
                      <span className="dot" style={{ background: color(STRANDS[id].color) }} />
                      {STRANDS[id].region}
                    </td>
                    <td>{bandFor(learner.ratings[id])}</td>
                    <td>{st.attempts || '—'}</td>
                    <td>{acc === null ? '—' : `${acc}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="muted small">
            “Level” is a friendly band, not a grade. Reading-level estimates and
            trends over time arrive with saved accounts in a later release.
          </p>
        </>
      )}
    </div>
  );
}
