import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { updateConfig, beginUpstoxLogin } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout, ErrorBanner } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Switch, NumberField } from '@/components/ui/Switch';
import { formatPercent, formatMoney } from '@/utils/format';
import { cn } from '@/lib/cn';

/**
 * Two different save behaviours on one page, on purpose.
 *
 * The kill switch applies IMMEDIATELY. It is the control you reach for when
 * something is wrong, and putting a Save button between "stop trading" and
 * trading stopping is a design that costs money exactly once.
 *
 * The entry rules are a form with an explicit Save. They are deliberate
 * tuning, not an emergency, and a daily cap that changed the instant a digit
 * was typed would fire a write on the way from 2 to 20 — briefly setting the
 * cap to the one value nobody wants.
 */
/**
 * The daily reconnect, and the countdown to the next one.
 *
 * Upstox retires the live access token at 03:30 IST every morning and issues
 * no refresh token for the standard grant, so this cannot be automated without
 * storing broker credentials — which this project will not do. What it CAN do
 * is make the reconnect one click and the expiry impossible to miss: on
 * 2 Sep 2026 a token died at 03:30, the first signal arrived at 09:25, and six
 * hours of orders failed with nothing anywhere saying why.
 */
function UpstoxConnection({ live }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!live) return null;

  const token = live.token || {};
  const notConfigured = token.state === 'not_configured';
  const valid = token.state === 'valid';
  const hours = token.hoursLeft;
  // Under three hours there is a real chance of the token dying before or
  // during the session, so it stops being informational and becomes a warning.
  const expiringSoon = valid && hours != null && hours < 3;

  async function connect() {
    setBusy(true);
    setErr('');
    try {
      const res = await beginUpstoxLogin();
      // A new tab rather than a redirect: losing the dashboard mid-login is
      // how you end up unsure whether the reconnect actually completed.
      window.open(res.login_url, '_blank', 'noopener');
    } catch (e) {
      setErr(e.message || 'Could not start the Upstox login');
    } finally {
      setBusy(false);
    }
  }

  const TONE = {
    valid: expiringSoon
      ? 'border-warn-line bg-warn-soft text-warn'
      : 'border-profit-line bg-profit-soft text-profit',
    expired: 'border-loss-line bg-loss-soft text-loss',
    no_token: 'border-warn-line bg-warn-soft text-warn',
    not_configured: 'border-line bg-subtle text-muted',
  };
  const LABEL = {
    valid: expiringSoon ? 'Expiring soon' : 'Connected',
    expired: 'Expired',
    no_token: 'Not connected',
    not_configured: 'Not configured',
  };

  return (
    <Card className="mb-5">
      <CardHeader
        title="Upstox connection"
        description="Live only — the token Upstox retires at 03:30 IST every day"
        actions={
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold whitespace-nowrap',
              TONE[token.state] || TONE.not_configured
            )}
          >
            {LABEL[token.state] || token.state}
          </span>
        }
      />
      <CardBody className="pt-3">
        {err && <p className="text-loss mb-3 text-xs">{err}</p>}

        {notConfigured ? (
          <>
            <p className="text-ink-soft text-[0.8125rem] leading-relaxed">
              Live trading needs these in the server environment before it can authenticate at all:
            </p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {(token.missing || []).map((m) => (
                <li key={m} className="text-muted flex items-center gap-2 text-xs">
                  <KeyRound className="text-faint size-3.5 shrink-0" aria-hidden="true" />
                  <code className="bg-subtle text-ink-soft rounded px-1.5 py-0.5">{m}</code>
                </li>
              ))}
            </ul>
            <p className="text-muted mt-3 text-xs leading-relaxed">
              Create an app in the Upstox developer console, set these, and restart the server.
            </p>
          </>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <Rate label="Account" value={token.userId || '—'} />
              <Rate
                label="Expires"
                value={
                  token.expiresAt
                    ? new Date(token.expiresAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour12: false,
                      })
                    : '—'
                }
              />
              <Rate label="Time left" value={hours == null ? '—' : `${hours}h`} />
              <Rate label="Master switch" value={live.enabled ? 'On' : 'Off'} />
            </dl>

            {token.lastError && (
              <p className="border-loss-line bg-loss-soft text-loss mt-3 rounded-lg border px-3 py-2 text-xs">
                Last failure: {token.lastError}
              </p>
            )}

            {!live.enabled && (
              <p className="border-line bg-subtle text-muted mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed">
                <code className="text-ink-soft">LIVE_TRADING_ENABLED</code> is off in the
                environment, so nothing goes live even with a valid token.
              </p>
            )}
          </>
        )}

        <Button
          variant="primary"
          size="md"
          className="mt-4 w-full sm:w-auto"
          onClick={connect}
          disabled={busy || notConfigured}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ExternalLink className="size-3.5" aria-hidden="true" />
          )}
          {valid ? 'Reconnect Upstox' : 'Connect Upstox'}
        </Button>
        <p className="text-faint mt-2 text-[0.6875rem] leading-relaxed">
          Opens Upstox in a new tab. Repeat every trading day — the token cannot outlive 03:30 IST
          no matter when it was issued.
        </p>
      </CardBody>
    </Card>
  );
}

export default function Settings() {
  const { config, refresh, mode, isLive } = useOutletContext();
  const { logout } = useAuth();

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [killBusy, setKillBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Re-seed the form whenever the server's view changes, but never while the
  // user is mid-edit — the 30s poll would otherwise reach in and overwrite a
  // half-typed value.
  // Environment switch re-seeds the form: paper's daily cap is not live's.
  useEffect(() => {
    setDraft(null);
  }, [mode]);

  useEffect(() => {
    if (!config) return;
    setDraft((prev) =>
      prev === null
        ? {
            max_trades_per_day: String(config.max_trades_per_day),
            re_entry_cooldown_enabled: config.re_entry_cooldown_enabled,
            re_entry_cooldown_minutes: String(config.re_entry_cooldown_minutes),
          }
        : prev
    );
  }, [config]);

  if (!config || !draft) {
    return (
      <Card>
        <CardBody>
          <div className="text-muted flex items-center justify-center gap-2 py-10 text-[0.8125rem]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Reading settings…
          </div>
        </CardBody>
      </Card>
    );
  }

  const readOnly = config.config_source === 'env-fallback';
  const dirty =
    String(config.max_trades_per_day) !== draft.max_trades_per_day ||
    config.re_entry_cooldown_enabled !== draft.re_entry_cooldown_enabled ||
    String(config.re_entry_cooldown_minutes) !== draft.re_entry_cooldown_minutes;

  async function patch(body, setBusy) {
    setBusy(true);
    setError('');
    try {
      await updateConfig(body, mode);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return true;
    } catch (err) {
      if (err.status === 401) {
        logout();
        return false;
      }
      setError(err.message || 'Could not save');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveRules() {
    const ok = await patch(
      {
        max_trades_per_day: Number(draft.max_trades_per_day),
        re_entry_cooldown_enabled: draft.re_entry_cooldown_enabled,
        re_entry_cooldown_minutes: Number(draft.re_entry_cooldown_minutes),
      },
      setSaving
    );
    if (ok) setDraft(null); // re-seed from the server's answer, not the request
  }

  return (
    <div className="mx-auto max-w-2xl">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Which environment these switches belong to. Without it the page looks
          identical in both modes, and "I turned trading off" stops saying
          WHICH book stopped. */}
      <div
        className={cn(
          'mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[0.8125rem]',
          isLive ? 'border-loss-line bg-loss-soft' : 'border-line bg-subtle/60'
        )}
      >
        <span
          aria-hidden="true"
          className={cn('size-2 shrink-0 rounded-full', isLive ? 'bg-loss' : 'bg-muted')}
        />
        <span className={isLive ? 'text-loss' : 'text-ink-soft'}>
          {isLive ? (
            <>
              <strong className="font-semibold">Configuring LIVE.</strong> These settings govern
              real orders with real money.
            </>
          ) : (
            <>
              <strong className="text-ink font-semibold">Configuring Paper.</strong> Sandbox only —
              switch environment in the header to configure live.
            </>
          )}
        </span>
      </div>

      <UpstoxConnection live={config.live} />

      {readOnly && (
        <Callout tone="warn">
          <strong className="text-ink font-semibold">Settings are not saving yet.</strong> The
          database is still missing migration 004, so these values are being read from environment
          variables and any change here will be discarded. Run{' '}
          <code className="bg-warn-soft rounded px-1 py-px text-[0.75rem]">
            sql/migrations/004_charges_and_runtime_config.sql
          </code>{' '}
          against Supabase first.
        </Callout>
      )}

      {/* ---- Kill switch -------------------------------------------------- */}
      <Card className="mb-5">
        <CardHeader
          title="Auto-trading"
          description="Applies immediately — no save needed"
        />
        <CardBody className="pt-1">
          <Switch
            id="trading-enabled"
            tone="danger"
            checked={config.trading_enabled}
            disabled={killBusy}
            onChange={(v) => patch({ trading_enabled: v }, setKillBusy)}
            label={config.trading_enabled ? 'Trading is ON' : 'Trading is OFF'}
            description={
              config.trading_enabled
                ? 'New entries are being placed. Turn this off to stop the bridge acting on any further signal.'
                : 'Every incoming signal is being refused. Exits and the end-of-day square-off still run.'
            }
          />
          {!config.trading_enabled && (
            <div className="border-loss-line bg-loss-soft text-loss mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
              <Power className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Nothing will be traded while this is off — including setups the strategy would
                otherwise have taken.
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- Entry gates -------------------------------------------------- */}
      <Card className="mb-5">
        <CardHeader
          title="Entry rules"
          description="What is allowed to open a position. Exits are never gated by these."
        />
        <CardBody className="pt-1">
          <NumberField
            id="max-trades"
            label="Max trades per day"
            description="Per symbol, counted on the IST day. 0 removes the cap entirely."
            value={draft.max_trades_per_day}
            min={0}
            max={50}
            suffix="trades"
            disabled={readOnly}
            onChange={(v) => setDraft({ ...draft, max_trades_per_day: v })}
          />

          <div className="border-line border-t">
            <Switch
              id="cooldown-enabled"
              checked={draft.re_entry_cooldown_enabled}
              disabled={readOnly}
              onChange={(v) => setDraft({ ...draft, re_entry_cooldown_enabled: v })}
              label="Re-entry cooldown"
              description="After a stop-loss, trailing-stop or time-stop exit, block a new entry on the SAME side for a while. This is not based on profit or loss — a winning trailing-stop exit blocks exactly the same as a losing one. A reversal to the other side is always allowed immediately."
            />
          </div>

          {draft.re_entry_cooldown_enabled && (
            <div className="border-line border-t">
              <NumberField
                id="cooldown-minutes"
                label="Cooldown length"
                description="0 has the same effect as switching the cooldown off."
                value={draft.re_entry_cooldown_minutes}
                min={0}
                max={240}
                suffix="minutes"
                disabled={readOnly}
                onChange={(v) => setDraft({ ...draft, re_entry_cooldown_minutes: v })}
              />
            </div>
          )}

          <div className="border-line mt-2 flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-muted text-xs">
              {saved && !dirty ? (
                <span className="text-profit inline-flex items-center gap-1.5 font-medium">
                  <Check className="size-3.5" aria-hidden="true" />
                  Saved
                </span>
              ) : dirty ? (
                'Unsaved changes'
              ) : (
                'Up to date'
              )}
            </span>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button size="md" onClick={() => setDraft(null)} disabled={saving}>
                  Discard
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={saveRules}
                disabled={!dirty || saving || readOnly}
              >
                {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                Save changes
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ---- Why the cap exists ------------------------------------------- */}
      <Card className="mb-5">
        <CardHeader title="Why the cap is 2" description="Measured, not chosen by feel" />
        <CardBody className="pt-3">
          <p className="text-ink-soft text-[0.8125rem] leading-relaxed">
            Per-trade expectancy is negative in two independent samples, so fewer trades is better
            arithmetically. The effect was monotonic in both measurement windows:
          </p>
          <div className="scroll-x mt-3 -mx-4 px-4 sm:-mx-5 sm:px-5">
            <table className="tnum w-full text-[0.8125rem]">
              <thead>
                <tr className="border-line border-b">
                  <th className="text-muted py-2 pr-3 text-left text-[0.6875rem] font-medium tracking-wide uppercase">
                    Cap
                  </th>
                  <th className="text-muted py-2 px-3 text-right text-[0.6875rem] font-medium tracking-wide uppercase whitespace-nowrap">
                    6–21 Aug
                  </th>
                  <th className="text-muted py-2 pl-3 text-right text-[0.6875rem] font-medium tracking-wide uppercase whitespace-nowrap">
                    17–21 Aug
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['No cap', -8859, 4202],
                  ['3 / day', -4545, 4368],
                  ['2 / day', 795, 5459],
                  ['1 / day', 5444, 7770],
                ].map(([label, a, b]) => (
                  <tr key={label} className="border-line border-b last:border-b-0">
                    <td className="text-ink-soft py-2 pr-3">{label}</td>
                    <td className={`py-2 px-3 text-right font-medium ${a >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatMoney(a)}
                    </td>
                    <td className={`py-2 pl-3 text-right font-medium ${b >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatMoney(b)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted mt-3 flex items-start gap-2 text-xs leading-relaxed">
            <ShieldAlert className="text-warn mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              1/day scores best but is the extreme end of the sweep and the most likely to be
              over-fit — and it yields only ~20 trades a month to learn from. 2 keeps a margin and
              collects twice the evidence.
            </span>
          </p>
        </CardBody>
      </Card>

      {/* ---- Rate card ---------------------------------------------------- */}
      {config.rates && (
      <Card>
        <CardHeader
          title="Charge rates"
          description="Used by the Report page. Edit in src/services/charges.js"
        />
        <CardBody className="pt-3">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <Rate label="Brokerage" value={`${formatMoney(config.rates.brokeragePerOrder, { showSign: false })} / order`} />
            <Rate label="API fee" value={`${formatMoney(config.rates.apiFeePerOrder, { showSign: false })} / order`} />
            <Rate label="STT (sell leg)" value={formatPercent(config.rates.sttSellPct)} />
            <Rate label="Exchange txn" value={formatPercent(config.rates.exchangeTxnPct)} />
            <Rate label="SEBI" value={`${formatMoney(config.rates.sebiPerCrore, { showSign: false })} / crore`} />
            <Rate label="IPFT" value={`${formatMoney(config.rates.ipftPerCrore, { showSign: false })} / crore`} />
            <Rate label="GST (on fees)" value={formatPercent(config.rates.gstPct)} />
            <Rate label="Stamp duty (buy leg)" value={formatPercent(config.rates.stampDutyBuyPct)} />
          </dl>
          <p className="text-muted mt-4 flex items-start gap-2 text-xs leading-relaxed">
            <AlertTriangle className="text-warn mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Verify these against a real Upstox contract note before trusting the Report page to
              the rupee. Statutory rates change — STT on option sales moved from 0.0625% to 0.1% in
              October 2024 — and this is the only place they are defined.
            </span>
          </p>
        </CardBody>
      </Card>
      )}
    </div>
  );
}

function Rate({ label, value }) {
  return (
    <div className="border-line flex items-baseline justify-between gap-3 border-b pb-2">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-ink tnum text-[0.8125rem] font-medium whitespace-nowrap">{value}</dd>
    </div>
  );
}
