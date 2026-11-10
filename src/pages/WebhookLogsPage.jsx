import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import WebhookLogsTable, { WebhookLogsList } from '@/components/tables/WebhookLogsTable';

/**
 * The last 30 alerts. Desktop keeps the table in a card; the phone shows the
 * day-grouped rows straight on the page, like Trades.
 */
export default function WebhookLogsPage() {
  const { webhookLogs } = useOutletContext();

  return (
    <>
      <Card className="hidden md:block">
        <CardHeader
          title="Recent signals"
          description="Last 30 alerts from TradingView · refreshes every 30s"
        />
        <CardBody>
          <WebhookLogsTable logs={webhookLogs} />
        </CardBody>
      </Card>

      <div className="md:hidden">
        <p className="text-muted mb-4 px-1 text-xs">Last 30 alerts from TradingView · refreshes every 30s</p>
        <WebhookLogsList logs={webhookLogs} />
      </div>
    </>
  );
}
