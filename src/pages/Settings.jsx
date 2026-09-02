import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Check, Loader2, Power, ShieldAlert } from 'lucide-react';
import { updateConfig } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout, ErrorBanner } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Switch, NumberField } from '@/components/ui/Switch';
import { formatPercent, formatMoney } from '@/utils/format';

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
export default function Settings() {
  const { config, refresh } = useOutletContext();
  const { logout } = useAuth();

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [killBusy, setKillBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Re-seed the form whenever the server's view changes, but never while the
  // user is mid-edit — the 30s poll would otherwise reach in and overwrite a
  // half-typed value.
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
      await updateConfig(body);
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
