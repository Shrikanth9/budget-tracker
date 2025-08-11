import React, { useCallback, useState } from "react";
import { toast } from "sonner";

export const useFetch = <T extends any[], R = any>(cb: (...args: T) => Promise<R>) => {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = useCallback(async (...args: T) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cb(...args);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [cb]);

  return { data, loading, error, fn };
};
