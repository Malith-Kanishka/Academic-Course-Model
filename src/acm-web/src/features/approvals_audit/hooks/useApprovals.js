import { useCallback, useEffect, useState } from 'react';
import approvalService from '../../../services/approvalService';

export default function useApprovals() {
	const [pendingApprovals, setPendingApprovals] = useState([]);
	const [auditHistory, setAuditHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');

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

	const handleDecision = useCallback(async (id, decision, feedback = '') => {
		const item = pendingApprovals.find((approval) => (approval.id ?? approval.approvalId) === id);
		if (!item) return;
		setNotice(''); setError('');
		setPendingApprovals((current) => current.filter((approval) => (approval.id ?? approval.approvalId) !== id));
		try {
			const result = await approvalService.submitDecision(id, decision, feedback);
			setAuditHistory((current) => [{ ...item, ...result, status: decision, feedback, decidedAt: new Date().toISOString() }, ...current]);
			setNotice(`Plan ${decision.toLowerCase()} successfully.`);
		} catch (requestError) {
			setPendingApprovals((current) => [item, ...current]);
			setError(requestError.response?.data?.message ?? 'The decision could not be submitted. The item was restored to the queue.');
			throw requestError;
		}
	}, [pendingApprovals]);

	return { pendingApprovals, auditHistory, loading, error, notice, handleDecision, reload: loadApprovals };
}
