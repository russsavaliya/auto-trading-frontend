import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import WebhookLogsTable from '@/components/tables/WebhookLogsTable';

export default function WebhookLogsPage() {
  const { webhookLogs } = useOutletContext();

  return (
    <Card>
      <CardHeader
        title="Recent signals"
        description="Last 30 alerts from TradingView · refreshes every 30s"
      />
      <CardBody>
        <WebhookLogsTable logs={webhookLogs} />
      </CardBody>
    </Card>
  );
}
