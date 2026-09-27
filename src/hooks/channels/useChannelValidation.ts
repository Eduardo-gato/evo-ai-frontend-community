import { toast } from 'sonner';

export interface FormData {
  [key: string]: string | boolean;
}

export const useChannelValidation = () => {
  const getStr = (form: FormData, key: string, fallback = ''): string =>
    typeof form[key] === 'string' ? (form[key] as string) : fallback;

  const validateWebWidget = (form: FormData) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'website_url').trim()) {
      toast.error('Website URL é obrigatório');
      return false;
    }
    // Validate URL format
    try {
      new URL(getStr(form, 'website_url'));
    } catch {
      toast.error('Website URL deve ser uma URL válida (ex: https://meusite.com)');
      return false;
    }
    return true;
  };

  const validateTwilioWhatsapp = (form: FormData) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'account_sid').trim()) {
      toast.error('Account SID é obrigatório');
      return false;
    }
    if (!getStr(form, 'auth_token').trim()) {
      toast.error('Auth Token é obrigatório');
      return false;
    }
    if (form.use_api_key && !getStr(form, 'api_key_sid').trim()) {
      toast.error('API Key SID é obrigatório quando usar API Key');
      return false;
    }
    if (form.use_messaging_service) {
      if (!getStr(form, 'messaging_service_sid').trim()) {
        toast.error('Messaging Service SID é obrigatório');
        return false;
      }
    } else {
      if (!getStr(form, 'phone_number').trim()) {
        toast.error('Telefone é obrigatório');
        return false;
      }
      // Validate phone number format (E.164)
      const phonePattern = /^\+[1-9]\d{1,14}$/;
      if (!phonePattern.test(getStr(form, 'phone_number'))) {
        toast.error('Telefone deve estar no formato internacional (+5511999999999)');
        return false;
      }
    }
    return true;
  };

  const validateNotificame = (form: FormData) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'phone_number').trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!getStr(form, 'api_token').trim()) {
      toast.error('API Token é obrigatório');
      return false;
    }
    if (!getStr(form, 'channel_id').trim()) {
      toast.error('Channel ID é obrigatório');
      return false;
    }
    // Validate phone number format (E.164)
    const phonePattern = /^\+[1-9]\d{1,14}$/;
    if (!phonePattern.test(getStr(form, 'phone_number'))) {
      toast.error('Telefone deve estar no formato internacional (+5511999999999)');
      return false;
    }
    return true;
  };

  const validateEvolution = (form: FormData, hasEvolutionConfig: boolean) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'phone_number').trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!hasEvolutionConfig) {
      if (!getStr(form, 'api_url').trim()) {
        toast.error('API URL é obrigatório');
        return false;
      }
      if (!getStr(form, 'admin_token').trim()) {
        toast.error('Admin Token é obrigatório');
        return false;
      }
    }
    // Validate phone number format (E.164)
    const phonePattern = /^\+[1-9]\d{1,14}$/;
    if (!phonePattern.test(getStr(form, 'phone_number'))) {
      toast.error('Telefone deve estar no formato internacional (+5511999999999)');
      return false;
    }
    return true;
  };

  const validateEvolutionGo = (form: FormData, hasEvolutionGoConfig: boolean) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'phone_number').trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!hasEvolutionGoConfig) {
      if (!getStr(form, 'api_url').trim()) {
        toast.error('API URL é obrigatório');
        return false;
      }
      if (!getStr(form, 'admin_token').trim()) {
        toast.error('Admin Token é obrigatório');
        return false;
      }
    }
    // Validate phone number format (E.164)
    const phonePattern = /^\+[1-9]\d{1,14}$/;
    if (!phonePattern.test(getStr(form, 'phone_number'))) {
      toast.error('Telefone deve estar no formato internacional (+5511999999999)');
      return false;
    }
    return true;
  };

  const validateWaha = (form: FormData, hasWahaConfig: boolean) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    // WAHA does not need the phone number up front: it is discovered from the
    // session (`/me`) after pairing. URL + API key are required when there is
    // no global WAHA config, or when the operator opted into a per-channel
    // server via the "use another WAHA server" toggle.
    const useCustomServer = !hasWahaConfig || form.use_custom_waha === true;
    if (useCustomServer) {
      const rawUrl = getStr(form, 'api_url').trim();
      if (!rawUrl) {
        toast.error('WAHA URL é obrigatória');
        return false;
      }
      if (!getStr(form, 'api_key').trim()) {
        toast.error('WAHA API Key é obrigatória');
        return false;
      }
      // Accept a host without scheme (e.g. `waha.example.com`); the backend
      // and submission default it to HTTPS.
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      try {
        new URL(normalized);
      } catch {
        toast.error('WAHA URL deve ser uma URL válida');
        return false;
      }
    }
    return true;
  };

  const validateZapi = (form: FormData) => {
    if (!getStr(form, 'name').trim()) {
      toast.error('Nome do canal é obrigatório');
      return false;
    }
    if (!getStr(form, 'phone_number').trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!getStr(form, 'instance_id').trim()) {
      toast.error('Instance ID é obrigatório');
      return false;
    }
    if (!getStr(form, 'token').trim()) {
      toast.error('Token é obrigatório');
      return false;
    }
    if (!getStr(form, 'client_token').trim()) {
      toast.error('Client Token é obrigatório');
      return false;
    }
    // Validate phone number format (E.164)
    const phonePattern = /^\+[1-9]\d{1,14}$/;
    if (!phonePattern.test(getStr(form, 'phone_number'))) {
      toast.error('Telefone deve estar no formato internacional (+5511999999999)');
      return false;
    }
    return true;
  };

  const validateByChannelAndProvider = (
    channelType: string,
    providerId: string | undefined,
    form: FormData,
    config?: {
      hasEvolutionConfig?: boolean;
      hasEvolutionGoConfig?: boolean;
      hasWahaConfig?: boolean;
    }
  ): boolean => {
    switch (channelType) {
      case 'web_widget':
        return validateWebWidget(form);

      case 'whatsapp':
        // Every other guard in this file toasts before returning false.
        if (!providerId) {
          toast.error('Selecione um provedor');
          return false;
        }

        switch (providerId) {
          case 'twilio':
            return validateTwilioWhatsapp(form);
          case 'notificame':
            return validateNotificame(form);
          case 'evolution':
            return validateEvolution(form, config?.hasEvolutionConfig ?? false);
          case 'evolution_go':
            return validateEvolutionGo(form, config?.hasEvolutionGoConfig ?? false);
          case 'waha':
            return validateWaha(form, config?.hasWahaConfig ?? false);
          case 'zapi':
            return validateZapi(form);
          default:
            return true;
        }

      default:
        return true;
    }
  };

  return {
    validateWebWidget,
    validateTwilioWhatsapp,
    validateNotificame,
    validateEvolution,
    validateEvolutionGo,
    validateWaha,
    validateZapi,
    validateByChannelAndProvider,
    getStr,
  };
};
