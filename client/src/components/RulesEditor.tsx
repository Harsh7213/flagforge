import React, { useState } from 'react';
import type { FlagEnvironment, Environment, RuleType, TargetingRule } from '../types';
import { useAddRuleMutation, useDeleteRuleMutation } from '../store/api/flagsApi';
import { useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface Props {
  flagId: string;
  environment: FlagEnvironment;
}

const RULE_TYPE_OPTIONS: { value: RuleType; label: string; placeholder: string }[] = [
  { value: 'user_ids', label: 'Specific Users', placeholder: 'user-123, user-456' },
  { value: 'groups', label: 'User Groups', placeholder: 'beta-testers, admins' },
  { value: 'percentage', label: 'Percentage Rollout', placeholder: '50' },
];

const RulesEditor: React.FC<Props> = ({ flagId, environment }) => {
  const dispatch = useAppDispatch();
  const [addRule, { isLoading: isAdding }] = useAddRuleMutation();
  const [deleteRule, { isLoading: isDeleting }] = useDeleteRuleMutation();

  const [showForm, setShowForm] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>('user_ids');
  const [ruleValue, setRuleValue] = useState('');

  const envLabel = environment.environment;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleValue.trim()) return;

    let value: string[] | number;

    if (ruleType === 'percentage') {
      const pct = parseFloat(ruleValue);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        dispatch(addToast({ type: 'error', message: 'Percentage must be 0–100' }));
        return;
      }
      value = pct;
    } else {
      value = ruleValue.split(',').map((v) => v.trim()).filter(Boolean);
    }

    try {
      await addRule({ flagId, env: envLabel as Environment, type: ruleType, value }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Targeting rule added' }));
      setRuleValue('');
      setShowForm(false);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to add rule' }));
    }
  };

  const handleDelete = async (rule: TargetingRule) => {
    try {
      await deleteRule({ flagId, ruleId: rule.id }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Rule removed' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to remove rule' }));
    }
  };

  const formatRuleValue = (rule: TargetingRule) => {
    if (rule.type === 'percentage') return `${rule.value}%`;
    try {
      const arr: string[] = JSON.parse(rule.value);
      return arr.join(', ');
    } catch {
      return rule.value;
    }
  };

  const selectedTypeOption = RULE_TYPE_OPTIONS.find((o) => o.value === ruleType)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Targeting Rules
        </h4>
        {!showForm && (
          <button
            className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-card border border-border-subtle text-xs text-brand-600 dark:text-brand-300 font-medium transition-all"
            onClick={() => setShowForm(true)}
            id={`add-rule-btn-${envLabel}`}
          >
            + Add Rule
          </button>
        )}
      </div>

      {environment.rules.length === 0 && !showForm ? (
        <p className="p-3 rounded-xl bg-surface-elevated border border-border-subtle text-xs text-slate-500 italic">
          No targeting rules — flag is shown to all users when enabled.
        </p>
      ) : (
        <div className="space-y-2">
          {environment.rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wide font-semibold ${
                  rule.type === 'user_ids'
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                    : rule.type === 'groups'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {rule.type === 'user_ids' ? '👤 Users' : rule.type === 'groups' ? '👥 Groups' : '🎯 %'}
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-mono truncate">{formatRuleValue(rule)}</span>
              </div>
              <button
                className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                onClick={() => handleDelete(rule)}
                disabled={isDeleting}
                title="Remove rule"
                aria-label={`Remove ${rule.type} rule`}
                id={`delete-rule-${rule.id}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-3" onSubmit={handleAdd}>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1" htmlFor={`rule-type-${envLabel}`}>
              Rule Type
            </label>
            <select
              id={`rule-type-${envLabel}`}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              value={ruleType}
              onChange={(e) => { setRuleType(e.target.value as RuleType); setRuleValue(''); }}
            >
              {RULE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1" htmlFor={`rule-value-${envLabel}`}>
              {ruleType === 'percentage' ? 'Percentage (0–100)' : 'Values (comma-separated)'}
            </label>
            <input
              id={`rule-value-${envLabel}`}
              type={ruleType === 'percentage' ? 'number' : 'text'}
              min={0}
              max={100}
              step={1}
              placeholder={selectedTypeOption.placeholder}
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
              autoFocus
              className="w-full px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isAdding}
              className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-medium transition-all shadow-sm"
              id={`submit-rule-${envLabel}`}
            >
              {isAdding ? 'Adding...' : 'Add Rule'}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-600 dark:text-slate-400 text-xs font-medium transition-all"
              onClick={() => { setShowForm(false); setRuleValue(''); }}
              id={`cancel-rule-${envLabel}`}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RulesEditor;
