import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Badge } from '@evoapi/design-system';
import { CheckCircle, QrCode, Trash2, Unplug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useGlobalConfig } from '@/contexts/GlobalConfigContext';
import { cn } from '@/utils/cn';
import InboxesService from '@/services/channels/inboxesService';
import WahaService from '@/services/channels/wahaService';
import type { WahaResponse } from '@/services/channels/wahaService';
import { FormField } from '@/components/channels/shared/FormField';

interface WahaConfigurationProps {
  inbox: {
    id?: string;
    name?: string;
    connection_state?: string;
    provider_config?: Record<string, unknown>;
  };
}

// WAHA session status -> translation key. Values arrive case-insensitively from
// `/waha/authorization/fetch` (upper-case WAHA payload lower-cased in state) and
// from the stored inbox `connection_state`.
const STATUS_KEYS: Record<string, string> = {
  working: 'working',
  open: 'working',
  connected: 'connected',
  stopped: 'stopped',
  close: 'disconnected',
  disconnected: 'disconnected',
  starting: 'starting',
  connecting: 'connecting',
  scan_qr_code: 'scanQrCode',
  failed: 'failed',
  error: 'failed',
  passkey_required: 'passkeyRequired',
  passkey_confirmation_required: 'passkeyConfirmationRequired',
  pending: 'connecting',
  unknown: 'unknown',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  working: 'bg-green-600 dark:bg-green-500 text-white',
  connected: 'bg-green-600 dark:bg-green-500 text-white',
  stopped: 'bg-red-600 dark:bg-red-500 text-white',
  disconnected: 'bg-red-600 dark:bg-red-500 text-white',
  failed: 'bg-red-600 dark:bg-red-500 text-white',
  starting: 'bg-amber-500 text-white',
  connecting: 'bg-amber-500 text-white',
  scanQrCode: 'bg-amber-500 text-white',
  passkeyRequired: 'bg-amber-500 text-white',
  passkeyConfirmationRequired: 'bg-amber-500 text-white',
  unknown: 'bg-muted text-muted-foreground',
};

const CONNECTED_STATUSES = ['working', 'open', 'connected'];

const qrDataUrl = (value: unknown): string | null => {
  const objectValue = value && typeof value === 'object' ? value as Record<string, unknown> : null;
  const candidate = objectValue?.base64 || objectValue?.qrcode || objectValue?.data || value;
  if (typeof candidate !== 'string' || !candidate) return null;
  return candidate.startsWith('data:') ? candidate : `data:image/png;base64,${candidate}`;
};

export const WahaConfiguration = ({ inbox }: WahaConfigurationProps) => {
  const { t } = useLanguage('channels');
  const { hasWahaConfig } = useGlobalConfig();
  const navigate = useNavigate();
  const config = inbox?.provider_config || {};
  const sessionValue = config.session || config.session_name;
  const session = typeof sessionValue === 'string' ? sessionValue : undefined;
  const [status, setStatus] = useState(String(inbox?.connection_state || 'unknown'));
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const initialApiUrl = typeof config.api_url === 'string' ? config.api_url : '';
  const [savedApiUrl, setSavedApiUrl] = useState<string>(initialApiUrl);
  const [savedKeyConfigured, setSavedKeyConfigured] = useState<boolean>(config.api_key_configured === true);
  const [apiUrl, setApiUrl] = useState<string>(initialApiUrl);
  const [apiKey, setApiKey] = useState('');
  const [serverLoading, setServerLoading] = useState(false);
  const [syncingWebhook, setSyncingWebhook] = useState(false);

  const statusKey = STATUS_KEYS[status.toLowerCase()] || 'unknown';
  const isConnected = CONNECTED_STATUSES.includes(status.toLowerCase());
  const i18nPrefix = 'settings.configuration.whatsapp.waha';

  // The paired number is discovered server-side via WAHA `/me` and stored on
  // provider_config. Until then the channel has no phone number to show.
  const meRecord = config.me && typeof config.me === 'object' ? (config.me as Record<string, unknown>) : undefined;
  const connectedDigits = typeof meRecord?.id === 'string' ? meRecord.id.split('@')[0] : undefined;
  const connectedPhone = connectedDigits ? `+${connectedDigits}` : undefined;
  const subtitle = connectedPhone || session || t(`${i18nPrefix}.sessionNotConfigured`);

  const fetchStatus = useCallback(async () => {
    if (!session) return;
    try {
      const response: WahaResponse = await WahaService.fetch(session);
      const connection = response?.provider_connection?.connection || response?.data?.status || response?.status;
      if (connection) setStatus(String(connection).toLowerCase());
    } catch {
      // The webhook remains the source of truth; polling is best effort.
    }
  }, [session]);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(fetchStatus, 5000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  const refreshQrCode = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    const response = await WahaService.getQRCode(session);
    const qr = qrDataUrl(response?.qrcode || response);
    if (!qr) return false;
    setQrCode(qr);
    return true;
  }, [session]);

  // WAHA regenerates the QR every ~20s, so a static image goes stale before it
  // can be scanned. Refresh it while the dialog is open.
  useEffect(() => {
    if (!dialogOpen || !session) return;
    const interval = window.setInterval(() => {
      refreshQrCode().catch(() => {
        // Best effort: keep showing the last valid QR until the next tick.
      });
    }, 15000);
    return () => window.clearInterval(interval);
  }, [dialogOpen, session, refreshQrCode]);

  // Once the session is connected, close the QR dialog.
  useEffect(() => {
    if (dialogOpen && isConnected) {
      setDialogOpen(false);
      setQrCode(null);
    }
  }, [dialogOpen, isConnected]);

  const connect = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Starting an already running session is a no-op; ignore start errors so
      // an existing SCAN_QR_CODE session can still surface its QR Code.
      if (!isConnected) {
        await WahaService.connect(session).catch(() => undefined);
      }
      let hasQr = await refreshQrCode();
      if (!hasQr) {
        await new Promise(resolve => window.setTimeout(resolve, 2000));
        hasQr = await refreshQrCode();
      }
      if (!hasQr) throw new Error(t(`${i18nPrefix}.toasts.qrError`));
      setDialogOpen(true);
    } catch (error) {
      toast.error((error as Error).message || t(`${i18nPrefix}.toasts.connectError`));
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const disconnect = async () => {
    if (!session) return;
    try {
      await WahaService.logout(session);
      await fetchStatus();
      toast.success(t(`${i18nPrefix}.toasts.sessionLoggedOut`));
    } catch (error) {
      toast.error((error as Error).message || t(`${i18nPrefix}.toasts.disconnectError`));
    }
  };

  const saveServer = async () => {
    if (!session) return;
    if (!apiUrl.trim()) {
      toast.error(t(`${i18nPrefix}.server.urlRequired`));
      return;
    }
    setServerLoading(true);
    try {
      const trimmed = apiUrl.trim();
      const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const response = await WahaService.updateSettings({
        session,
        apiUrl: normalizedUrl,
        apiKey: apiKey.trim() || undefined,
      });
      const updated = response?.provider_config || {};
      const nextUrl = typeof updated.api_url === 'string' ? updated.api_url : normalizedUrl;
      setSavedApiUrl(nextUrl);
      setApiUrl(nextUrl);
      setSavedKeyConfigured(updated.api_key_configured === true);
      setApiKey('');
      toast.success(t(`${i18nPrefix}.server.saved`));
      fetchStatus();
    } catch (error) {
      toast.error((error as Error).message || t(`${i18nPrefix}.server.error`));
    } finally {
      setServerLoading(false);
    }
  };

  const useGlobalServer = async () => {
    if (!session) return;
    setServerLoading(true);
    try {
      await WahaService.updateSettings({ session, useGlobal: true });
      setSavedApiUrl('');
      setApiUrl('');
      setApiKey('');
      setSavedKeyConfigured(hasWahaConfig === true);
      toast.success(t(`${i18nPrefix}.server.globalSaved`));
      fetchStatus();
    } catch (error) {
      toast.error((error as Error).message || t(`${i18nPrefix}.server.error`));
    } finally {
      setServerLoading(false);
    }
  };

  const syncWebhook = async () => {
    if (!session) return;
    setSyncingWebhook(true);
    try {
      await WahaService.syncWebhook(session);
      toast.success(t(`${i18nPrefix}.server.webhookSynced`));
    } catch (error) {
      toast.error((error as Error).message || t(`${i18nPrefix}.server.webhookError`));
    } finally {
      setSyncingWebhook(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!inbox?.id) return;
    setDeleting(true);
    try {
      await InboxesService.remove(inbox.id);
      toast.success(t('success.removeSuccess'));
      navigate('/channels');
    } catch (error) {
      toast.error((error as Error)?.message || t('errors.removeError'));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className={cn('w-5 h-5', isConnected ? 'text-green-600' : 'text-muted-foreground')} />
            <div>
              <h3 className="font-semibold">WAHA</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <Badge className={cn('ml-auto', STATUS_BADGE_CLASS[statusKey])}>
              {t(`${i18nPrefix}.status.${statusKey}`)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            {isConnected ? (
              <Button variant="outline" onClick={disconnect} disabled={!session}>
                <Unplug className="w-4 h-4 mr-2" />
                {t(`${i18nPrefix}.disconnect`)}
              </Button>
            ) : (
              <Button onClick={connect} loading={loading} disabled={!session}>
                <QrCode className="w-4 h-4 mr-2" />
                {t(`${i18nPrefix}.connect`)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold">{t(`${i18nPrefix}.server.title`)}</h3>
            <p className="text-sm text-muted-foreground">{t(`${i18nPrefix}.server.help`)}</p>
          </div>
          <Badge variant="outline">
            {savedApiUrl ? t(`${i18nPrefix}.server.modeCustom`) : t(`${i18nPrefix}.server.modeGlobal`)}
          </Badge>
          <div className="space-y-4">
            <FormField
              label={t(`${i18nPrefix}.server.apiUrlLabel`)}
              value={apiUrl}
              onChange={setApiUrl}
              placeholder="https://waha.exemplo.com"
              type="url"
            />
            <FormField
              label={t(`${i18nPrefix}.server.apiKeyLabel`)}
              value={apiKey}
              onChange={setApiKey}
              placeholder={
                savedKeyConfigured
                  ? t(`${i18nPrefix}.server.apiKeyKeepPlaceholder`)
                  : '••••••••'
              }
              type="password"
              helpText={t(`${i18nPrefix}.server.apiKeyKeepPlaceholder`)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveServer} loading={serverLoading} disabled={!session}>
              {t(`${i18nPrefix}.server.save`)}
            </Button>
            {hasWahaConfig && savedApiUrl && (
              <Button variant="outline" onClick={useGlobalServer} disabled={!session || serverLoading}>
                {t(`${i18nPrefix}.server.useGlobal`)}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={syncWebhook}
              loading={syncingWebhook}
              disabled={!session || serverLoading || syncingWebhook}
            >
              {t(`${i18nPrefix}.server.syncWebhook`)}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(`${i18nPrefix}.qrDialog.title`)}</DialogTitle>
            <DialogDescription>{t(`${i18nPrefix}.qrDialog.description`)}</DialogDescription>
          </DialogHeader>
          {qrCode && <img src={qrCode} alt={t(`${i18nPrefix}.getQrCode`)} className="mx-auto max-w-xs" />}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={!inbox?.id || deleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t('deleteDialog.title')}
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', { name: inbox?.name || session || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChannel}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
