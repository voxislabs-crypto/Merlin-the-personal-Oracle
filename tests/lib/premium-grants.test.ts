import { isLifetimeGrantedUser } from '@/lib/premium-grants';

describe('premium-grants', () => {
  const originalLifetimeUserIds = process.env.LIFETIME_USER_IDS;
  const originalPremiumEmails = process.env.PREMIUM_EMAILS;

  afterEach(() => {
    process.env.LIFETIME_USER_IDS = originalLifetimeUserIds;
    process.env.PREMIUM_EMAILS = originalPremiumEmails;
  });

  it('recognizes manually granted user ids', () => {
    expect(isLifetimeGrantedUser('user_39wOhHuS5AuJ3Hj9aJUGXCCDZDS', null)).toBe(true);
  });

  it('recognizes manually granted emails', () => {
    expect(isLifetimeGrantedUser('user_other', 'silorush99@gmail.com')).toBe(true);
  });

  it('recognizes env-configured grants', () => {
    process.env.LIFETIME_USER_IDS = 'user_env_123';
    process.env.PREMIUM_EMAILS = 'vip@example.com';

    expect(isLifetimeGrantedUser('user_env_123', null)).toBe(true);
    expect(isLifetimeGrantedUser('user_other', 'vip@example.com')).toBe(true);
    expect(isLifetimeGrantedUser('user_other', 'free@example.com')).toBe(false);
  });
});