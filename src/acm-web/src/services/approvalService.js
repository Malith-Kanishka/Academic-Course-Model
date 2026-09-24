import apiClient from './apiClient';

export const mockPendingApprovals = [
	{ id: 'approval-101', approvalId: 'approval-101', studentName: 'Amaya Perera', module: 'Data Structures', courseModule: 'Data Structures', date: '2026-09-24', urgency: 'High', masteryScore: 42, studentAnswer: 'A stack removes the oldest item first, like a queue.', expectedStandard: 'A stack follows LIFO: the most recently added item is removed first.', missingConcepts: ['LIFO ordering', 'Stack versus queue'], remedialPlan: ['Review LIFO and FIFO with visual examples', 'Complete five stack operation exercises'] },
	{ id: 'approval-102', approvalId: 'approval-102', studentName: 'Ravin Silva', module: 'Database Design', courseModule: 'Database Design', date: '2026-09-23', urgency: 'Medium', masteryScore: 63, studentAnswer: 'A foreign key uniquely identifies every row in its own table.', expectedStandard: 'A foreign key references a primary key in another table to maintain referential integrity.', missingConcepts: ['Referential integrity', 'Primary and foreign key roles'], remedialPlan: ['Map relationships between three sample tables', 'Practice identifying candidate keys'] },
	{ id: 'approval-103', approvalId: 'approval-103', studentName: 'Nethmi Fernando', module: 'Software Architecture', courseModule: 'Software Architecture', date: '2026-09-22', urgency: 'Low', masteryScore: 74, studentAnswer: 'The repository pattern keeps data access separate from business rules.', expectedStandard: 'The repository pattern abstracts persistence concerns behind a collection-like interface.', missingConcepts: ['Persistence abstraction'], remedialPlan: ['Compare repository and service responsibilities', 'Refactor a tightly coupled data access example'] },
];

export const mockAuditHistory = [
	{ ...mockPendingApprovals[0], status: 'Approved', decidedAt: '2026-09-24T09:30:00Z', feedback: 'Plan is ready to assign.' },
	{ ...mockPendingApprovals[1], status: 'Rejected', decidedAt: '2026-09-23T14:15:00Z', feedback: 'Add one more exercise on referential integrity.' },
];

const unwrap = (response) => response?.data ?? response ?? [];

const approvalService = {
	async getPendingApprovals() {
		try { return unwrap(await apiClient.get('/Approval/pending')); } catch { return mockPendingApprovals; }
	},
	async submitDecision(id, decision, feedback = '') {
		const status = decision === 'Approved' ? 'Approved' : 'Rejected';
		try { return unwrap(await apiClient.post('/Approval/decision', { approvalId: id, status, feedback })); } catch { return { approvalId: id, status, feedback }; }
	},
	async getAuditHistory() {
		try { return unwrap(await apiClient.get('/Approval/history')); } catch { return mockAuditHistory; }
	},
};

export default approvalService;
