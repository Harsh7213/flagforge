import { Router } from 'express';
import { requireAuth, apiKeyAuth } from '../middleware/auth';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projects.controller';
import { listFlags, getFlag, createFlag, updateFlag, deleteFlag, toggleEnvironment, getFlagAuditLogs, getStats, addRule, deleteRule } from '../controllers/flags.controller';
import { evaluate, batchEvaluate } from '../controllers/evaluation.controller';
import { getAuditLogs } from '../controllers/audit.controller';
import { getCurrentUser, login, logout, register } from '../controllers/auth.controller';

const router = Router();

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, getCurrentUser);

// Dashboard API Routes (Protected by JWT)
router.get('/projects', requireAuth, getProjects);
router.post('/projects', requireAuth, createProject);
router.patch('/projects/:id', requireAuth, updateProject);
router.delete('/projects/:id', requireAuth, deleteProject);

router.get('/flags', requireAuth, listFlags);
router.post('/flags', requireAuth, createFlag);
router.get('/flags/:id', requireAuth, getFlag);
router.patch('/flags/:id', requireAuth, updateFlag);
router.delete('/flags/:id', requireAuth, deleteFlag);
router.post('/flags/:id/environments/:env/toggle', requireAuth, toggleEnvironment);
router.get('/flags/:id/audit', requireAuth, getFlagAuditLogs);
router.post('/flags/:id/rules', requireAuth, addRule);
router.delete('/flags/:id/rules/:ruleId', requireAuth, deleteRule);

router.get('/stats', requireAuth, getStats);

router.get('/audit', requireAuth, getAuditLogs);

// SDK Evaluation Routes (Protected by API Key)
router.post('/evaluate', apiKeyAuth, evaluate);
router.post('/evaluate/batch', apiKeyAuth, batchEvaluate);

export default router;
