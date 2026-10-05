import apiClient from './apiClient';

/** @typedef {{ studentName?: string, studentEmail?: string }} RemedialPlan */

const unwrap = (response) => response?.data ?? response ?? [];

const normalizePlan = (plan) => {
  const report = plan.masteryReport ?? plan.MasteryReport ?? {};
  const actionItems = plan.actionItems ?? plan.ActionItems ?? [];
  const misconceptions = report.flaggedMisconceptions ?? report.FlaggedMisconceptions ?? [];
  const score = report.masteryScore ?? report.MasteryScore ?? plan.masteryScore ?? plan.MasteryScore ?? 0;
  const id = plan.planId ?? plan.PlanId ?? plan.id ?? plan.Id ?? plan.approvalId ?? plan.ApprovalId;
  const topicName = plan.topicName ?? plan.TopicName ?? report.topicName ?? report.TopicName ?? '';
  const moduleName = plan.moduleName ?? plan.ModuleName ?? '';

  return {
    ...plan,
    id,
    approvalId: id,
    planId: id,
    studentId: plan.studentId ?? plan.StudentId,
    studentName: plan.studentName ?? plan.StudentName,
    studentEmail: plan.studentEmail ?? plan.StudentEmail,
    topicName,
    moduleName,
    topic: plan.topic ?? plan.Topic ?? '',
    module: (plan.module ?? plan.Module) || topicName || moduleName || 'General Topic',
    courseModule: (plan.courseModule ?? plan.CourseModule) || topicName || moduleName || 'General Topic',
    date: plan.date ?? plan.Date ?? plan.createdAt ?? plan.CreatedAt,
    createdAt: plan.createdAt ?? plan.CreatedAt,
    masteryScore: score,
    score,
    missingConcepts: misconceptions,
    studentSubmission: plan.studentSubmission ?? plan.StudentSubmission ?? '',
    expectedStandard: plan.expectedStandard ?? plan.ExpectedStandard ?? '',
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

  async getMyActiveRemedialPlans() {
    const response = await apiClient.get('/Approval/mine');
    return normalizeList(unwrap(response));
  },

  async submitDecision(id, decision, { editedPlanSummary, lecturerNotes } = {}) {
    const status = decision === 'Approved' ? 'APPROVED_ACTIVE' : 'REJECTED';
    const response = await apiClient.post('/Approval/decision', {
      planId: id,
      status,
      editedPlanSummary: editedPlanSummary ?? null,
      lecturerNotes: lecturerNotes || null,
      notes: lecturerNotes || null,
      decision,
      professorFeedback: lecturerNotes || null,
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

  async deletePlan(id) {
    await apiClient.delete(`/Approval/${id}`);
  },
};

export default approvalService;
