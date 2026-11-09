import { Download, Share, SquarePlus, Smartphone, CircleCheck } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

/**
 * Install-as-app, in whichever form this browser supports: a real button
 * where the browser allows one, the two manual steps on an iPhone, and a
 * plain confirmation once it is already running as an installed app.
 *
 * Renders nothing in a desktop browser that cannot install — there is no
 * action to offer there, and an explanation nobody can act on is clutter.
 */
export default function InstallCard({ className }) {
  const { installed, canPrompt, iosManual, install } = useInstallPrompt();

  if (!installed && !canPrompt && !iosManual) return null;

  return (
    <Card className={className}>
      <CardHeader
        title="Phone app"
        description="Open the dashboard from your home screen, full screen, like any other app"
      />
      <CardBody className="pt-3">
        {installed && (
          <p className="text-profit flex items-center gap-2 text-[0.8125rem] font-medium">
            <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
            Installed — you are using the app
          </p>
        )}

        {canPrompt && (
          <Button variant="primary" size="lg" onClick={install} className="w-full sm:w-auto">
            <Download className="size-4" aria-hidden="true" />
            Install app
          </Button>
        )}

        {iosManual && !canPrompt && (
          <ol className="text-ink-soft space-y-3 text-[0.8125rem]">
            <li className="flex items-center gap-3">
              <Step n={1} />
              <span className="flex flex-wrap items-center gap-1">
                Tap <Share className="size-4" aria-label="Share" /> <strong>Share</strong> in Safari
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Step n={2} />
              <span className="flex flex-wrap items-center gap-1">
                Choose <SquarePlus className="size-4" aria-hidden="true" />
                <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="text-muted flex items-center gap-3 text-xs">
              <Smartphone className="size-4 shrink-0" aria-hidden="true" />
              Use Safari — other iPhone browsers cannot install apps.
            </li>
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

function Step({ n }) {
  return (
    <span className="bg-ink text-canvas flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold">
      {n}
    </span>
  );
}
