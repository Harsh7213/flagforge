import { describe, expect, it } from 'vitest';
import { createProjectSchema, updateProjectSchema } from '../controllers/projects.controller';
import { createFlagSchema, updateFlagSchema, addRuleSchema } from '../controllers/flags.controller';
import { registerSchema, loginSchema } from '../controllers/auth.controller';
import { acceptInvitationSchema, invitationSchema } from '../controllers/organization.controller';
import { INPUT_LIMITS } from '../../../shared/inputLimits';

describe('database-backed input length limits', () => {
  it('limits project names to the projects.name column size', () => {
    expect(
      createProjectSchema.safeParse({ name: 'p'.repeat(INPUT_LIMITS.projectName) }).success
    ).toBe(true);
    expect(
      createProjectSchema.safeParse({ name: 'p'.repeat(INPUT_LIMITS.projectName + 1) }).success
    ).toBe(false);
    expect(
      updateProjectSchema.safeParse({ name: 'p'.repeat(INPUT_LIMITS.projectName + 1) }).success
    ).toBe(false);
  });

  it('limits flag keys and names to 20 and descriptions to 50 characters', () => {
    const baseFlag = {
      key: 'f'.repeat(INPUT_LIMITS.flagKey),
      name: 'n'.repeat(INPUT_LIMITS.flagName),
      projectId: '00000000-0000-4000-8000-000000000000'
    };

    expect(createFlagSchema.safeParse(baseFlag).success).toBe(true);
    expect(
      createFlagSchema.safeParse({ ...baseFlag, key: 'f'.repeat(INPUT_LIMITS.flagKey + 1) }).success
    ).toBe(false);
    expect(
      createFlagSchema.safeParse({ ...baseFlag, name: 'n'.repeat(INPUT_LIMITS.flagName + 1) })
        .success
    ).toBe(false);
    expect(
      createFlagSchema.safeParse({
        ...baseFlag,
        description: 'd'.repeat(INPUT_LIMITS.flagDescription)
      }).success
    ).toBe(true);
    expect(
      createFlagSchema.safeParse({
        ...baseFlag,
        description: 'd'.repeat(INPUT_LIMITS.flagDescription + 1)
      }).success
    ).toBe(false);
    expect(
      updateFlagSchema.safeParse({ name: 'n'.repeat(INPUT_LIMITS.flagName + 1) }).success
    ).toBe(false);
    expect(
      updateFlagSchema.safeParse({ description: 'd'.repeat(INPUT_LIMITS.flagDescription + 1) })
        .success
    ).toBe(false);
  });

  it('limits registered user and organization names to their column sizes', () => {
    const registration = {
      name: 'u'.repeat(INPUT_LIMITS.userName),
      email: 'user@example.com',
      password: 'a'.repeat(INPUT_LIMITS.passwordMinimum),
      organizationName: 'o'.repeat(INPUT_LIMITS.organizationName)
    };

    expect(registerSchema.safeParse(registration).success).toBe(true);
    expect(
      registerSchema.safeParse({ ...registration, name: 'u'.repeat(INPUT_LIMITS.userName + 1) })
        .success
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...registration,
        organizationName: 'o'.repeat(INPUT_LIMITS.organizationName + 1)
      }).success
    ).toBe(false);
    expect(
      acceptInvitationSchema.safeParse({
        token: 't'.repeat(32),
        name: 'u'.repeat(INPUT_LIMITS.userName + 1),
        password: 'a'.repeat(INPUT_LIMITS.passwordMinimum)
      }).success
    ).toBe(false);
  });

  it('limits account and invitation emails to 255 characters', () => {
    const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(
      INPUT_LIMITS.email - 64 - 1 - 63 - 1 - 63 - 1 - 4
    )}.com`;
    expect(email.length).toBe(INPUT_LIMITS.email);
    expect(loginSchema.safeParse({ email, password: 'password' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: `a${email}`, password: 'password' }).success).toBe(false);
    expect(invitationSchema.safeParse({ email }).success).toBe(true);
    expect(invitationSchema.safeParse({ email: `a${email}` }).success).toBe(false);
  });

  it('validates user group and specific user identifiers against [a-zA-Z0-9-_]', () => {
    // Valid identifiers
    expect(
      addRuleSchema.safeParse({
        type: 'user_ids',
        value: ['user-123', 'admin_456', 'BetaUser']
      }).success
    ).toBe(true);

    expect(
      addRuleSchema.safeParse({
        type: 'groups',
        value: ['beta-testers', 'group_1', 'INTERNAL_QA']
      }).success
    ).toBe(true);

    // Invalid identifiers with spaces, special characters
    expect(
      addRuleSchema.safeParse({
        type: 'user_ids',
        value: ['user 123']
      }).success
    ).toBe(false);

    expect(
      addRuleSchema.safeParse({
        type: 'user_ids',
        value: ['user@example.com']
      }).success
    ).toBe(false);

    expect(
      addRuleSchema.safeParse({
        type: 'groups',
        value: ['group#1!']
      }).success
    ).toBe(false);

    expect(
      addRuleSchema.safeParse({
        type: 'user_ids',
        value: []
      }).success
    ).toBe(false);
  });
});
