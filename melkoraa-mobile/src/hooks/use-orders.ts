import { useCallback, useEffect, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import type { OrderDetailDto, OrderSummaryDto } from "@/src/api/types/orders";
import { orderService } from "@/src/services/order.service";
import { useAuth } from "@/src/auth/auth-context";

export function useOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setOrders([]);
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await orderService.list();
    if (result.status === "success") {
      setOrders(result.data.data);
      setAuthRequired(false);
      setError(null);
    } else if (result.status === "auth_required") {
      setAuthRequired(true);
      setOrders([]);
    } else {
      setError(userFacingApiMessage(new Error(result.message)));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, loading, authRequired, error, refresh: load };
}

export function useOrder(orderId: string) {
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await orderService.getById(orderId);
    if (result.status === "success") {
      setOrder(result.data);
      setError(null);
    } else if (result.status === "error") {
      setError(userFacingApiMessage(new Error(result.message)));
      setOrder(null);
    }
    setLoading(false);
  }, [session, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, loading, error, refresh: load };
}
