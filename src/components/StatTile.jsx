/**
 * A single headline number.
 *
 * `hero` enlarges the value for the one figure a screen leads with. `hint`
 * renders a caveat line in the warning tone — used for things the reader must
 * not miss when reading the number, such as trades excluded from a total
 * because their premium could not be determined.
 */
export default function StatTile({ label, value, tone, sub, hint, hero = false }) {
  return (
    <div className={`stat-tile${hero ? ' hero' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` ${tone}` : ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
