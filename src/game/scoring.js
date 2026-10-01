export const RANKS = ['Ghost', 'Shadow', 'Contractor', 'Intern', 'Cautionary Tale'];

/** Phase 1 run rating; Briefings clamp at Intern and never award career points. */
export function runRank(cost, par, type = 'briefing') {
  const index =
    cost <= par ? 0 : cost <= par * 2 ? 1 : cost <= par * 3 ? 2 : cost <= par * 4 ? 3 : 4;
  return type === 'briefing' ? Math.min(index, 3) : index;
}
