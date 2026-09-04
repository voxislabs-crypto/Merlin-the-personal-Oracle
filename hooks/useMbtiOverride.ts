'use client';

import { useCallback, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import type { MBTIType } from '@/lib/mbti-overlay';
import {
  MBTI_OVERRIDE_CORE_KEY,
  MBTI_OVERRIDE_LEGACY_KEY,
  MBTI_OVERRIDE_MASK_KEY,
  readMbtiUserOverride,
  type MbtiUserOverride,
} from '@/lib/personality/mbti-override';

function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

export function useMbtiOverride() {
  const { user, isLoaded } = useUser();
  const [saving, setSaving] = useState(false);

  const override: MbtiUserOverride = useMemo(
    () => readMbtiUserOverride(asMetadata(user?.unsafeMetadata)),
    [user?.unsafeMetadata],
  );

  const writeMetadata = useCallback(
    async (mutate: (meta: Record<string, unknown>) => void) => {
      if (!user) return;
      setSaving(true);
      try {
        const meta = asMetadata(user.unsafeMetadata);
        mutate(meta);
        await user.update({ unsafeMetadata: meta });
      } catch (error) {
        console.error('Failed to save MBTI override:', error);
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const setCoreOverride = useCallback(
    async (type: MBTIType) => {
      await writeMetadata((meta) => {
        meta[MBTI_OVERRIDE_CORE_KEY] = type;
        delete meta[MBTI_OVERRIDE_LEGACY_KEY];
      });
    },
    [writeMetadata],
  );

  const clearCoreOverride = useCallback(async () => {
    await writeMetadata((meta) => {
      delete meta[MBTI_OVERRIDE_CORE_KEY];
      delete meta[MBTI_OVERRIDE_LEGACY_KEY];
    });
  }, [writeMetadata]);

  const setMaskOverride = useCallback(
    async (type: MBTIType) => {
      await writeMetadata((meta) => {
        meta[MBTI_OVERRIDE_MASK_KEY] = type;
      });
    },
    [writeMetadata],
  );

  const clearMaskOverride = useCallback(async () => {
    await writeMetadata((meta) => {
      delete meta[MBTI_OVERRIDE_MASK_KEY];
    });
  }, [writeMetadata]);

  return {
    isLoaded,
    canEdit: Boolean(user),
    saving,
    coreOverride: override.core,
    maskOverride: override.mask,
    setCoreOverride,
    clearCoreOverride,
    setMaskOverride,
    clearMaskOverride,
  };
}
