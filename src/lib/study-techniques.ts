export const techniques = {
  short: { label: 'Short Focus Session', focus: 20, rest: 2 },
  pomodoro: { label: 'Pomodoro', focus: 25, rest: 5 },
  long: { label: 'Long Focus Session', focus: 50, rest: 10 },
  custom: { label: 'Custom Session', focus: 25, rest: 5 },
} as const;
export type Technique = keyof typeof techniques;
export function durations(technique: Technique, focus: number, rest: number) {
  return technique === 'custom' ? { focus, rest } : techniques[technique];
}