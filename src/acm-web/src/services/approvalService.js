import apiClient from './apiClient';

const unwrap = (response) => response?.data ?? response ?? [];

const normalizePlan = (plan) => {
  const report = plan.masteryReport ?? plan.MasteryReport ?? {};
  const actionItems = plan.actionItems ?? plan.ActionItems ?? [];
  const misconceptions = report.flaggedMisconceptions ?? report.FlaggedMisconceptions ?? [];
  const score = report.masteryScore ?? report.MasteryScore ?? plan.masteryScore ?? plan.MasteryScore ?? 0;
  const id = plan.id ?? plan.Id ?? plan.planId ?? plan.PlanId;

  return {
    ...plan,
    id,
    approvalId: id,
    planId: id,
    studentId: plan.studentId ?? plan.StudentId,
    studentName: plan.studentName ?? plan.StudentName ?? `Student ${plan.studentId ?? plan.StudentId ?? ''}`.trim(),
    module: plan.module ?? plan.Module ?? report.topicName ?? report.TopicName ?? 'Unassigned module',
    courseModule: plan.courseModule ?? plan.CourseModule ?? report.topicName ?? report.TopicName ?? 'Unassigned module',
    date: plan.date ?? plan.Date ?? plan.createdAt ?? plan.CreatedAt,
    createdAt: plan.createdAt ?? plan.CreatedAt,
    masteryScore: score,
    score,
    missingConcepts: misconceptions,
    remedialPlan: actionItems,
    approvalStatus: plan.approvalStatus ?? plan.ApprovalStatus,
    feedback: plan.professorNotes ?? plan.ProfessorNotes,
  };
};

const normalizeList = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];
  return items.map(normalizePlan);
};

const approvalService = {
  async getPendingApprovals() {
    const response = await apiClient.get('/Approval/pending');
    return normalizeList(unwrap(response));
  },

  async submitDecision(id, decision, feedback = '') {
    const status = decision === 'Approved' ? 'APPROVED_ACTIVE' : 'REJECTED';
    const response = await apiClient.post('/Approval/decision', {
      planId: id,
      status,
      notes: feedback || null,
      decision,
      professorFeedback: feedback || null,
    });
    return normalizePlan(unwrap(response));
  },

  async getAuditHistory() {
    try {
      const response = await apiClient.get('/Approval/history');
      return normalizeList(unwrap(response));
    } catch (error) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  },
};

export default approvalService;
