export const isStandaloneMobileClient =
  process.env.NEXT_PUBLIC_STANDALONE_MOBILE === 'true';

export const isStandaloneMobileServer =
  process.env.STANDALONE_MOBILE === 'true' ||
  process.env.NEXT_PUBLIC_STANDALONE_MOBILE === 'true';