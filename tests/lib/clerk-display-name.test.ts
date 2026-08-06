import { resolveClerkFirstName } from '@/lib/auth/clerk-display-name';

describe('resolveClerkFirstName', () => {
  it('prefers Clerk firstName', () => {
    expect(
      resolveClerkFirstName({ firstName: 'Alex', fullName: 'Alex Rivera' }),
    ).toBe('Alex');
  });

  it('uses first word of fullName when firstName empty', () => {
    expect(resolveClerkFirstName({ firstName: null, fullName: 'Jordan Lee' })).toBe(
      'Jordan',
    );
  });

  it('falls back to username / email local part', () => {
    expect(resolveClerkFirstName({ username: 'sam_dev' })).toBe('Sam');
    expect(
      resolveClerkFirstName({
        primaryEmailAddress: { emailAddress: 'morgan@example.com' },
      }),
    ).toBe('Morgan');
  });

  it('returns null when nothing usable', () => {
    expect(resolveClerkFirstName(null)).toBeNull();
    expect(
      resolveClerkFirstName({
        primaryEmailAddress: { emailAddress: 'x7k2+tag@mail.com' },
      }),
    ).toBeNull();
  });
});
