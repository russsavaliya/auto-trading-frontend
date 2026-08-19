import { useOutletContext } from 'react-router-dom';
import WebhookLogsTable from '../components/WebhookLogsTable';

export default function WebhookLogsPage() {
  const { webhookLogs } = useOutletContext();

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Recent webhook calls</div>
          <div className="panel-title-muted">Latest 30 · refreshes every 30s</div>
        </div>
      </div>
      <WebhookLogsTable logs={webhookLogs} />
    </div>
  );
}
