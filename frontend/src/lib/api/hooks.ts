/**
 * React hooks for API integration
 * Handles state management, error handling, and optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { api, type Deal, type DealTimeline, type DisputeCase, ApiError } from './client';
import { logDealMutation, logTimelineFetch, logApiFailure } from '../error-handling';

/**
 * Hook for fetching and managing deal state
 */
export function useDeal(dealId: string | null) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeal = useCallback(async () => {
    if (!dealId) {
      setDeal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.deals.get(dealId);
      if (response.data) {
        setDeal(response.data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch deal');
      setError(error);
      setDeal(null);
      
      if (err instanceof ApiError) {
        logApiFailure(`/api/deals/${dealId}`, 'GET', err.status, err.message, { dealId });
      } else {
        logApiFailure(`/api/deals/${dealId}`, 'GET', 0, error.message, { dealId });
      }
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const refetch = useCallback(() => {
    return fetchDeal();
  }, [fetchDeal]);

  return { deal, loading, error, refetch };
}

/**
 * Hook for fetching deal timeline
 */
export function useDealTimeline(dealId: string | null) {
  const [timeline, setTimeline] = useState<DealTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!dealId) {
      setTimeline(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.deals.getTimeline(dealId);
      if (response.data) {
        setTimeline(response.data);
        logTimelineFetch(dealId, true, response.data.items.length);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch timeline');
      setError(error);
      setTimeline(null);
      logTimelineFetch(dealId, false, undefined, error);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const refetch = useCallback(() => {
    return fetchTimeline();
  }, [fetchTimeline]);

  return { timeline, loading, error, refetch };
}

/**
 * Hook for deal mutations with error handling
 */
export function useDealMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async <T,>(
      mutationFn: () => Promise<T>,
      onSuccess?: (data: T) => void | Promise<void>,
      onError?: (error: Error) => void
    ) => {
      setLoading(true);
      setError(null);

      try {
        const data = await mutationFn();
        if (onSuccess) {
          await onSuccess(data);
        }
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new ApiError('Mutation failed', 0);
        setError(error);
        if (onError) {
          onError(error);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, loading, error };
}

/**
 * Hook for admin dispute list
 */
export function useDisputeList(status?: string) {
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.admin.listDisputes(status);
      if (response.data) {
        setDisputes(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch disputes'));
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const refetch = useCallback(() => {
    return fetchDisputes();
  }, [fetchDisputes]);

  return { disputes, loading, error, refetch };
}
