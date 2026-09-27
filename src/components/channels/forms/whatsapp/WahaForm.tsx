import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@evoapi/design-system';
import { useLanguage } from '@/hooks/useLanguage';
import { FormField } from '../../shared/FormField';
import { FormCheckbox } from '../../shared/FormCheckbox';
import { FormSection } from '../../shared/FormSection';
import { FormData } from '@/hooks/channels/useChannelForm';

const DEFAULT_ENGINE = 'GOWS';

const WAHA_ENGINES = [
  { value: 'GOWS', label: 'GOWS' },
  { value: 'WEBJS', label: 'WEBJS' },
  { value: 'NOWEB', label: 'NOWEB' },
  { value: 'WPP', label: 'WPP' },
] as const;

interface WahaFormProps {
  form: FormData;
  onFormChange: (key: string, value: string | boolean) => void;
  hasWahaConfig: boolean;
}

export const WahaForm = ({ form, onFormChange, hasWahaConfig }: WahaFormProps) => {
  const { t } = useLanguage('whatsapp');
  const getStr = (key: string, fallback = '') =>
    typeof form[key] === 'string' ? (form[key] as string) : fallback;
  // Without a global WAHA config the fields are always required. With a global
  // config, the operator can opt into a different server for this channel.
  const useCustomServer = !hasWahaConfig || !!form.use_custom_waha;

  return (
    <div className="space-y-6">
      {hasWahaConfig && (
        <div className="space-y-2">
          <FormCheckbox
            label={t('wahaForm.fields.customServer.label')}
            checked={!!form.use_custom_waha}
            onChange={checked => onFormChange('use_custom_waha', checked)}
          />
          <p className="text-xs text-sidebar-foreground/60">
            {t('wahaForm.fields.customServer.help')}
          </p>
        </div>
      )}
      {useCustomServer ? (
        <>
          <FormField
            label={t('wahaForm.fields.apiUrl.label')}
            value={getStr('api_url')}
            onChange={value => onFormChange('api_url', value)}
            placeholder={t('wahaForm.fields.apiUrl.placeholder')}
            type="url"
            helpText={t('wahaForm.fields.apiUrl.help')}
          />
          <FormField
            label={t('wahaForm.fields.apiKey.label')}
            value={getStr('api_key')}
            onChange={value => onFormChange('api_key', value)}
            placeholder={t('wahaForm.fields.apiKey.placeholder')}
            type="password"
            helpText={t('wahaForm.fields.apiKey.help')}
          />
        </>
      ) : (
        <p className="text-sm text-sidebar-foreground/70">
          {t('wahaForm.usingGlobalConfig')}
        </p>
      )}
      <FormSection title={t('wahaForm.sections.engine.title')}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-sidebar-foreground/80">
            {t('wahaForm.fields.engine.label')}
          </label>
          <Select
            value={getStr('engine', DEFAULT_ENGINE).toUpperCase()}
            onValueChange={value => onFormChange('engine', value.toUpperCase())}
          >
            <SelectTrigger className="w-full bg-sidebar border-sidebar-border text-sidebar-foreground">
              <SelectValue placeholder={DEFAULT_ENGINE} />
            </SelectTrigger>
            <SelectContent className="bg-sidebar border-sidebar-border text-sidebar-foreground">
              {WAHA_ENGINES.map(engine => (
                <SelectItem key={engine.value} value={engine.value}>
                  {engine.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-sidebar-foreground/60">
            {t('wahaForm.fields.engine.help')}
          </p>
        </div>
        <div className="space-y-3 mt-4">
          <p className="text-sm font-medium text-sidebar-foreground/80">
            {t('wahaForm.sections.ignore.title')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormCheckbox
              label={t('wahaForm.fields.ignoreGroups.label')}
              checked={!!form.ignoreGroups}
              onChange={checked => onFormChange('ignoreGroups', checked)}
            />
            <FormCheckbox
              label={t('wahaForm.fields.ignoreStatus.label')}
              checked={!!form.ignoreStatus}
              onChange={checked => onFormChange('ignoreStatus', checked)}
            />
            <FormCheckbox
              label={t('wahaForm.fields.ignoreChannels.label')}
              checked={!!form.ignoreChannels}
              onChange={checked => onFormChange('ignoreChannels', checked)}
            />
            <FormCheckbox
              label={t('wahaForm.fields.ignoreBroadcast.label')}
              checked={!!form.ignoreBroadcast}
              onChange={checked => onFormChange('ignoreBroadcast', checked)}
            />
          </div>
          <p className="text-xs text-sidebar-foreground/60">{t('wahaForm.sections.ignore.help')}</p>
        </div>
      </FormSection>
      <details className="p-4 rounded-lg border border-sidebar-border bg-sidebar">
        <summary className="cursor-pointer text-sm font-semibold text-sidebar-foreground">
          {t('wahaForm.sections.advanced.title')}
        </summary>
        <div className="mt-4">
          <FormField
            label={t('wahaForm.fields.session.label')}
            value={getStr('session')}
            onChange={value => onFormChange('session', value)}
            placeholder={t('wahaForm.fields.session.placeholder')}
            helpText={t('wahaForm.fields.session.help')}
          />
        </div>
      </details>
      <p className="text-xs text-sidebar-foreground/60">{t('wahaForm.help')}</p>
    </div>
  );
};
