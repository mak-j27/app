import { getPasswordStrength } from '../../utils/passwordUtils';

describe('passwordUtils.getPasswordStrength', () => {
  test('returns expected shape and score for common passwords', () => {
    const weak = getPasswordStrength('password');
    expect(weak).toHaveProperty('score');
    expect(weak.score).toBeGreaterThanOrEqual(0);
    expect(weak).toHaveProperty('entropy');
    expect(weak).toHaveProperty('feedback');
    expect(weak.feedback).toHaveProperty('warning');
  });

  test('strong password yields high score', () => {
    const strong = getPasswordStrength('Tr0ub4dor&3x!@#ABCD');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropy).toBeGreaterThan(20);
  });
});
