import pool from '../db/pool';
import { EvaluationRequest, EvaluationResult, TargetingRule } from '../types';

/**
 * Core flag evaluation engine.
 * Evaluation order:
 *  1. Flag exists + not archived?
 *  2. Environment enabled?
 *  3. Targeting rules
 */
export async function evaluateFlag(req: EvaluationRequest): Promise<EvaluationResult> {
  const { flagKey, userName = [], groups = [], environment, projectId } = req;
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

  const rulesResult = await pool.query<TargetingRule>(
    `SELECT * FROM targeting_rules
     WHERE flag_environment_id = $1
     ORDER BY created_at ASC`,
    [env_id]
  );

  const rules = rulesResult.rows;

  const normalize = (value: string) => value.trim().toLowerCase();
  const userRules = rules.filter(rule => rule.type === 'user_ids');
  const groupRules = rules.filter(rule => rule.type === 'groups');
  const hasUserNames = userName.length > 0;
  const hasGroups = groups.length > 0;
  let disallowedNames: string[] = [];
  let disallowedGroups: string[] = [];

  if (rules.length === 0 && !hasUserNames && !hasGroups) {
    console.log("rules :", rules);
    return { flagKey, enabled: true, reason: 'GLOBALLY_ENABLED', environment };
  }

  if (hasUserNames) {
    const allowedNames = userRules.flatMap(rule => JSON.parse(rule.value) as string[]);
    const allowedNameSet = new Set(allowedNames.map(normalize));
    disallowedNames = userName.filter(name => !allowedNameSet.has(normalize(name)));
  }

  if (hasGroups) {
    const allowedGroups = groupRules.flatMap(rule => JSON.parse(rule.value) as string[]);
    const allowedGroupSet = new Set(allowedGroups.map(normalize));
    disallowedGroups = groups.filter(group => !allowedGroupSet.has(normalize(group)));
  }

  // When both names and groups are provided, both checks must pass.
  if (disallowedNames.length > 0 || disallowedGroups.length > 0) {
    return {
      flagKey,
      enabled: false,
      reason: 'TARGETING_RULES_NOT_MATCHED',
      ...(disallowedNames.length > 0 ? { disallowedNames } : {}),
      ...(disallowedGroups.length > 0 ? { disallowedGroups } : {}),
      environment
    };
  }

  if (hasUserNames || hasGroups) {
    return {
      flagKey,
      enabled: true,
      reason:
        hasUserNames && hasGroups
          ? 'MATCHED_USER_NAME_AND_GROUP'
          : hasUserNames
            ? 'MATCHED_USER_NAME'
            : 'MATCHED_GROUP',
      environment
    };
  }

  // No names or groups supplied: evaluate percentage rules.
  for (const rule of rules) {
    if (rule.type === 'percentage') {
      const percentage = Number(rule.value);
      const hash = Math.random() * 100;

      if (hash < percentage) {
        return {
          flagKey,
          enabled: true,
          reason: 'PERCENTAGE_ROLLOUT',
          environment
        };
      }
    }
  }

  return { flagKey, enabled: false, reason: 'NO_RULES_MATCHED', environment };
}