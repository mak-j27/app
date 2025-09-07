import { estimateEntropy, scoreFromEntropy, getPasswordStrength } from './passwordUtils';

describe('passwordUtils', () => {
  test('estimateEntropy returns 0 for empty', () => {
    expect(estimateEntropy('')).toBe(0);
  });

  test('estimateEntropy increases with complexity', () => {
    const e1 = estimateEntropy('aaaaaa');
    const e2 = estimateEntropy('aA1!aA1!');
    expect(e2).toBeGreaterThan(e1);
  });

  test('scoreFromEntropy buckets correctly', () => {
    expect(scoreFromEntropy(10).score).toBe(0);
    expect(scoreFromEntropy(30).score).toBe(1);
    expect(scoreFromEntropy(50).score).toBe(2);
    expect(scoreFromEntropy(70).score).toBe(3);
    expect(scoreFromEntropy(100).score).toBe(4);
  });

  test('getPasswordStrength returns sensible object', () => {
    const s = getPasswordStrength('Abc123!@#');
    expect(s).toHaveProperty('entropy');
    expect(s).toHaveProperty('score');
    expect(s).toHaveProperty('label');
    expect(s).toHaveProperty('color');
    expect(s).toHaveProperty('percent');
  });
});
