export interface PayoutMilestone {
  views: number;
  payout: number;
}

export function calculateEligiblePayout(
  views: number,
  milestones: PayoutMilestone[]
): number {
  return milestones
    .filter((milestone) => views >= milestone.views)
    .reduce(
      (highest, milestone) => Math.max(highest, milestone.payout),
      0
    );
}

export function calculateAdditionalPayout(
  eligiblePayout: number,
  alreadyPaid: number,
  remainingBudget: number
): number {
  const additionalEligiblePayout = Math.max(
    0,
    eligiblePayout - alreadyPaid
  );

  return Math.min(additionalEligiblePayout, remainingBudget);
}