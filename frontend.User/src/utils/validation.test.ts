// Teste de utilitários de validação
describe('Validation Utils', () => {
  test('validates email format', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('validates password strength', () => {
    const isStrongPassword = (password: string) => {
      return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    };

    expect(isStrongPassword('Password123')).toBe(true);
    expect(isStrongPassword('weak')).toBe(false);
    expect(isStrongPassword('noNumber')).toBe(false);
  });

  test('formats tournament score', () => {
    const formatScore = (wins: number, total: number) => {
      if (total === 0) return '0%';
      return `${Math.round((wins / total) * 100)}%`;
    };

    expect(formatScore(3, 4)).toBe('75%');
    expect(formatScore(0, 5)).toBe('0%');
    expect(formatScore(5, 5)).toBe('100%');
    expect(formatScore(0, 0)).toBe('0%');
  });
});