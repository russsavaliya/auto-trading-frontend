import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import PositionsTable from '@/components/tables/PositionsTable';

export default function PositionsPage() {
  const { positions } = useOutletContext();

  return (
    <Card>
      <CardHeader
        title="Symbol positions"
        description="A symbol stuck off FLAT blocks every new signal for it"
      />
      <CardBody>
        <PositionsTable positions={positions} />
      </CardBody>
    </Card>
  );
}
