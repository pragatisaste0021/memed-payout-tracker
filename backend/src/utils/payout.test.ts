import {
  calculateEligiblePayout,
  calculateAdditionalPayout,
} from "./payout";

const milestones = [
  { views: 1000, payout: 500 },
  { views: 5000, payout: 2000 },
  { views: 10000, payout: 4000 },
];

describe("calculateEligiblePayout", () => {
  test("returns zero when no milestone is reached", () => {
    expect(calculateEligiblePayout(500, milestones)).toBe(0);
  });

  test("returns the highest milestone reached", () => {
    expect(calculateEligiblePayout(6000, milestones)).toBe(2000);
  });

  test("returns the payout at an exact milestone threshold", () => {
    expect(calculateEligiblePayout(5000, milestones)).toBe(2000);
  });
});

describe("calculateAdditionalPayout", () => {
  test("pays the full eligible amount when budget is sufficient", () => {
    expect(calculateAdditionalPayout(2000, 0, 10000)).toBe(2000);
  });

  test("subtracts the amount already paid", () => {
    expect(calculateAdditionalPayout(2000, 500, 10000)).toBe(1500);
  });

  test("never exceeds the remaining campaign budget", () => {
    expect(calculateAdditionalPayout(2000, 500, 1200)).toBe(1200);
  });

  test("does not pay twice for the same milestone", () => {
    expect(calculateAdditionalPayout(2000, 2000, 8000)).toBe(0);
  });

  test("does not pay when the budget is exhausted", () => {
    expect(calculateAdditionalPayout(4000, 2000, 0)).toBe(0);
  });
});