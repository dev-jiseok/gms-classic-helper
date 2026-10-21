import { score } from './score.js';

export function describeScore(level, bonus) {
  return `score:${score(level, bonus)}`;
}
