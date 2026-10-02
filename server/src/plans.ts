export const PROJECT_PLAN_ENTITLEMENTS = {
  standard: {
    evaluationsPerMinute: 60,
    batchRequestsPerMinute: 10,
    monthlyProjectEvaluations: 10000,
    monthlyOrganizationEvaluations: 50000
  }
} as const;

export type ProjectPlan = keyof typeof PROJECT_PLAN_ENTITLEMENTS;

export const getProjectPlanEntitlements = (plan?: string) =>
  PROJECT_PLAN_ENTITLEMENTS[plan as ProjectPlan] ?? PROJECT_PLAN_ENTITLEMENTS.standard;