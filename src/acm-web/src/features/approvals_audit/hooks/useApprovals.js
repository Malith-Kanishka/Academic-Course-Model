import { useCallback, useEffect, useState } from 'react';
import approvalService from '../../../services/approvalService';

export default function useApprovals() {
	const [pendingApprovals, setPendingApprovals] = useState([]);
	const [auditHistory, setAuditHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	 const [deletingPlanId, setDeletingPlanId] = useState(null);

	const loadApprovals = useCallback(async () => {
		setLoading(true); setError('');
		try {
			const [pending, history] = await Promise.all([approvalService.getPendingApprovals(), approvalService.getAuditHistory()]);
			setPendingApprovals(Array.isArray(pending) ? pending : []); setAuditHistory(Array.isArray(history) ? history : []);
		} catch (requestError) {
			setError(requestError.response?.data?.message ?? 'Unable to load approval data from the API. Please try again.');
		} finally { setLoading(false); }
	}, []);

	useEffect(() => { loadApprovals(); }, [loadApprovals]);

	const handleDecision = useCallback(async (id, decision, details = {}) => {
		const item = pendingApprovals.find((approval) => (approval.id ?? approval.approvalId) === id);
		if (!item) return;
		const { editedPlanSummary, lecturerNotes } = typeof details === 'string'
			? { lecturerNotes: details }
			: details;
		setNotice(''); setError('');
		setPendingApprovals((current) => current.filter((approval) => (approval.id ?? approval.approvalId) !== id));
		try {
			const result = await approvalService.submitDecision(id, decision, { editedPlanSummary, lecturerNotes });
			setAuditHistory((current) => [{ ...item, ...result, status: decision, feedback: lecturerNotes, decidedAt: new Date().toISOString() }, ...current]);
			setNotice(`Plan ${decision.toLowerCase()} successfully.`);
		} catch (requestError) {
			setPendingApprovals((current) => [item, ...current]);
			setError(requestError.response?.data?.message ?? 'The decision could not be submitted. The item was restored to the queue.');
			throw requestError;
		}
	}, [pendingApprovals]);

	const deletePlan = useCallback(async (id) => {
		setDeletingPlanId(id);
		setNotice(''); setError('');
		try {
			await approvalService.deletePlan(id);
			const matchesPlan = (item) => (item.id ?? item.approvalId ?? item.planId) !== id;
			setPendingApprovals((current) => current.filter(matchesPlan));
			setAuditHistory((current) => current.filter(matchesPlan));
			setNotice('Remedial plan deleted.');
			return true;
		} catch (requestError) {
			setError(requestError.response?.data?.message ?? 'The remedial plan could not be deleted. Please try again.');
			return false;
		} finally {
			setDeletingPlanId(null);
		}
	}, []);

	return { pendingApprovals, auditHistory, loading, error, notice, handleDecision, deletePlan, deletingPlanId, reload: loadApprovals };
}
