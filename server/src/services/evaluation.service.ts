import pool from '../db/pool';
import { Environment, EvaluationRequest, EvaluationResult, TargetingRule } from '../types';

/**
 * Core flag evaluation engine.
 * Evaluation order:
 *  1. Flag exists + not archived?
 *  2. Environment enabled?
 *  3. Targeting rules (user_ids → groups → percentage)?
 */
export async function evaluateFlag(req: EvaluationRequest): Promise<EvaluationResult> {
  const { flagKey, userId, groups = [], environment, projectId } = req;

  // 1. Fetch flag + environment state
  const flagResult = await pool.query(
    `SELECT ff.id, ff.archived, fe.id AS env_id, fe.enabled
     FROM feature_flags ff
     JOIN flag_environments fe ON fe.flag_id = ff.id
     WHERE ff.key = $1
       AND ff.project_id = $2
       AND fe.environment = $3`,
    [flagKey, projectId, environment]
  );

  if (flagResult.rows.length === 0) {
    return { flagKey, enabled: false, reason: 'FLAG_NOT_FOUND', environment };
  }

  const { archived, env_id, enabled } = flagResult.rows[0];

  if (archived) {
    return { flagKey, enabled: false, reason: 'FLAG_ARCHIVED', environment };
  }

  if (!enabled) {
    return { flagKey, enabled: false, reason: 'ENVIRONMENT_DISABLED', environment };
  }

  // 2. Fetch targeting rules for this environment
  const rulesResult = await pool.query<TargetingRule>(
    `SELECT * FROM targeting_rules WHERE flag_environment_id = $1 ORDER BY created_at ASC`,
    [env_id]
  );

  const rules = rulesResult.rows;

  if (rules.length === 0) {
    // No targeting rules — flag is on for everyone
    return { flagKey, enabled: true, reason: 'GLOBALLY_ENABLED', environment };
  }

  // 3. Evaluate each rule
  for (const rule of rules) {
    if (rule.type === 'user_ids' && userId) {
      const allowedUsers: string[] = JSON.parse(rule.value);
      if (allowedUsers.includes(userId)) {
        return { flagKey, enabled: true, reason: 'MATCHED_USER_ID', environment };
      }
    }

    if (rule.type === 'groups' && groups.length > 0) {
      const allowedGroups: string[] = JSON.parse(rule.value);
      const matched = groups.some((g) => allowedGroups.includes(g));
      if (matched) {
        return { flagKey, enabled: true, reason: 'MATCHED_GROUP', environment };
      }
    }

    if (rule.type === 'percentage') {
      const percentage = parseFloat(rule.value);
      // Deterministic hash of userId to ensure consistent evaluation
      const hash = userId ? hashUserId(userId) : Math.random() * 100;
      if (hash < percentage) {
        return { flagKey, enabled: true, reason: 'PERCENTAGE_ROLLOUT', environment };
      }
    }
  }

  return { flagKey, enabled: false, reason: 'NO_RULES_MATCHED', environment };
}

/**
 * Simple deterministic hash of userId → 0-100 range
 * Uses a DJB2-style hash for consistency across evaluations.
 */
function hashUserId(userId: string): number {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) + hash + userId.charCodeAt(i);
    hash = hash & hash; // force 32-bit
  }
  return Math.abs(hash % 100);
}
