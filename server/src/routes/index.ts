import { Router } from 'express';
import { requireAuth, requireRole, csrfProtection, apiKeyAuth } from '../middleware/auth';
import { getProjects, createProject, updateProject, deleteProject, rotateApiKey, revokeApiKey } from '../controllers/projects.controller';
import { listFlags, getFlag, createFlag, updateFlag, deleteFlag, toggleEnvironment, getFlagAuditLogs, getStats, addRule, deleteRule } from '../controllers/flags.controller';
import { evaluate, batchEvaluate } from '../controllers/evaluation.controller';
import { getAuditLogs } from '../controllers/audit.controller';
import { getCurrentUser, login, logout, register } from '../controllers/auth.controller';
import { acceptInvitation, createInvitation, listMembers, removeMember } from '../controllers/organization.controller';

const router = Router();

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', requireAuth, csrfProtection, logout);
router.post('/auth/invitations/accept', acceptInvitation);
router.get('/auth/me', requireAuth, getCurrentUser);

router.post('/organizations/invitations', requireAuth, csrfProtection, requireRole('owner', 'admin'), createInvitation);
router.get('/organizations/members', requireAuth, requireRole('owner', 'admin'), listMembers);
router.delete('/organizations/members/:userId', requireAuth, csrfProtection, requireRole('owner', 'admin'), removeMember);

// Dashboard API Routes (Protected by JWT)
router.get('/projects', requireAuth, getProjects);
router.post('/projects', requireAuth, csrfProtection, requireRole('owner', 'admin'), createProject);
router.patch('/projects/:id', requireAuth, csrfProtection, requireRole('owner', 'admin'), updateProject);
router.delete('/projects/:id', requireAuth, csrfProtection, requireRole('owner', 'admin'), deleteProject);
router.post('/projects/:id/api-key/rotate', requireAuth, csrfProtection, requireRole('owner', 'admin'), rotateApiKey);
router.delete('/projects/:id/api-key', requireAuth, csrfProtection, requireRole('owner', 'admin'), revokeApiKey);

router.get('/flags', requireAuth, listFlags);
router.post('/flags', requireAuth, csrfProtection, requireRole('owner', 'admin'), createFlag);
router.get('/flags/:id', requireAuth, getFlag);
router.patch('/flags/:id', requireAuth, csrfProtection, requireRole('owner', 'admin'), updateFlag);
router.delete('/flags/:id', requireAuth, csrfProtection, requireRole('owner', 'admin'), deleteFlag);
router.post('/flags/:id/environments/:env/toggle', requireAuth, csrfProtection, requireRole('owner', 'admin'), toggleEnvironment);
router.get('/flags/:id/audit', requireAuth, getFlagAuditLogs);
router.post('/flags/:id/rules', requireAuth, csrfProtection, requireRole('owner', 'admin'), addRule);
router.delete('/flags/:id/rules/:ruleId', requireAuth, csrfProtection, requireRole('owner', 'admin'), deleteRule);

router.get('/stats', requireAuth, getStats);

router.get('/audit', requireAuth, getAuditLogs);

// SDK Evaluation Routes (Protected by API Key)
router.post('/evaluate', apiKeyAuth, evaluate);
router.post('/evaluate/batch', apiKeyAuth, batchEvaluate);

export default router;
