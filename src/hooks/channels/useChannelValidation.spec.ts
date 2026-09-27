import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChannelValidation } from './useChannelValidation';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';

describe('useChannelValidation > validateWaha', () => {
  const { result } = renderHook(() => useChannelValidation());
  const validate = (form: Record<string, string | boolean>, hasWahaConfig: boolean) =>
    result.current.validateWaha(form, hasWahaConfig);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires URL and API key when there is no global config', () => {
    expect(validate({ name: 'WAHA' }, false)).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('accepts a valid URL and API key when there is no global config', () => {
    expect(
      validate({ name: 'WAHA', api_url: 'https://waha.example.com', api_key: 'secret' }, false),
    ).toBe(true);
  });

  it('does not require URL or API key with a global config and no override', () => {
    expect(validate({ name: 'WAHA' }, true)).toBe(true);
  });

  it('requires URL and API key when the per-channel override is enabled', () => {
    expect(validate({ name: 'WAHA', use_custom_waha: true }, true)).toBe(false);
    expect(
      validate(
        { name: 'WAHA', use_custom_waha: true, api_url: 'https://waha.example.com', api_key: 'secret' },
        true,
      ),
    ).toBe(true);
  });
});
