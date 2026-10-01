/** Evaluate current conditions together, retaining only explicitly sticky objectives. */
export function evaluateObjectives(objectives, context, previous = {}) {
  return Object.fromEntries(
    objectives.map((objective) => [
      objective.id,
      Boolean((objective.sticky && previous[objective.id]) || objective.check(context)),
    ]),
  );
}

/** Empty objective lists cannot accidentally complete a mission. */
export function objectivesMet(objectives, values) {
  return objectives.length > 0 && objectives.every((objective) => values[objective.id]);
}
