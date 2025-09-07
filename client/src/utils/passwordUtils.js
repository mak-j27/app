import zxcvbn from 'zxcvbn';

export function estimateEntropy(password) {
  if (!password) return 0;
  try {
    const out = zxcvbn(password);
    // zxcvbn provides guessaed_entropy in some ports; use 'guesses_log10' to compute bits
    // but easiest is to use feedback and score; we'll approximate bits from guesses_log10 if present
    const guesses_log10 = out.guesses_log10 || (out.guesses ? Math.log10(out.guesses) : 0);
    const bits = Math.round((guesses_log10 * Math.log2(10)) * 10) / 10;
    return bits || 0;
  } catch {
    // fallback to 0 on error
    return 0;
  }
}

export function scoreFromEntropy(entropy) {
  if (entropy < 28) return { score: 0, label: 'Very weak' };
  if (entropy < 36) return { score: 1, label: 'Weak' };
  if (entropy < 60) return { score: 2, label: 'Fair' };
  if (entropy < 80) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

export function getPasswordStrength(password) {
  const out = zxcvbn(password || '');
  const entropy = estimateEntropy(password);
  const score = out.score || 0; // zxcvbn score 0..4
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const label = labels[score] || 'Unknown';
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];
  const color = colors[Math.max(0, Math.min(4, score))];
  const percent = (score / 4) * 100;
  return { entropy, score, label, color, percent, feedback: out.feedback };
}
