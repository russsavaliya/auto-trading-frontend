import { useOutletContext } from 'react-router-dom';
import PositionsTable from '../components/PositionsTable';

export default function PositionsPage() {
  const { positions } = useOutletContext();

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Symbol positions</div>
          <div className="panel-title-muted">
            A symbol stuck off FLAT blocks every new signal for it
          </div>
        </div>
      </div>
      <PositionsTable positions={positions} />
    </div>
  );
}
