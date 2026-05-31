// Canonical sourdough math — the single source of truth for the calculator's domain logic.
//
// These functions MUST stay byte-for-byte equivalent to the inline copies in
// sourdough-schedule.html (bulkHours, starterPrep, the DDT water formula, and the Recipe
// Lab total-hydration calc). dough-math.test.mjs both checks these reference values AND
// extracts the live bulkHours from the HTML to prove the two have not drifted apart.
//
// References: Forkish (Flour Water Salt Yeast), Robertson (Tartine), Hamelman (Bread).

// Bulk fermentation time. Q10-style model: rate ~doubles per ~8 °C (factor 2.2), and
// scales inversely with inoculation %. Reference point: 5.0 h at 24 °C with 20% levain.
export function bulkHours(tempC, inoc) {
  const refHours = 5.0;
  const refTemp = 24;
  const refInoc = 20;
  const tempFactor = Math.pow(2.2, (refTemp - tempC) / 8);
  const inocFactor = refInoc / inoc;
  return refHours * tempFactor * inocFactor;
}

// Lead time to get the starter ripe before mixing, by starter state and room temp.
export function starterPrep(state, tempC) {
  if (state === 'active') return 0;
  if (state === 'recent') return Math.max(3, 6 - (tempC - 22) * 0.3);
  if (state === 'cold') return Math.max(8, 12 - (tempC - 22) * 0.4);
  return 6;
}

// Desired Dough Temperature → water temperature. 3-factor formula (Hamelman): the
// multiplier equals the number of subtracted temperature masses (flour, room, friction).
// The levain is assumed ≈ room temperature.
export function ddtWaterC(target, flour, room, friction) {
  return target * 3 - flour - room - friction;
}

// True total hydration including the levain's own flour & water (assumes a 100%-hydration
// starter: half flour, half water). Inputs use baker's % on the ADDED flour only.
export function totalHydration(flour, hydration, levainPct) {
  const water = Math.round(flour * hydration / 100);
  const levainG = Math.round(flour * levainPct / 100);
  const totalFlour = flour + levainG / 2;
  if (totalFlour <= 0) return hydration;
  return Math.round((water + levainG / 2) / totalFlour * 1000) / 10;
}
