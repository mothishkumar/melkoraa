/**
 * Run a page query then its count on the same postgres.js pool.
 * Promise.all against the Supabase transaction pooler opens extra sockets
 * and is a common source of ECONNRESET on Windows `next dev`.
 */
export async function loadPagedRows<T>(
  loadRows: () => Promise<T[]>,
  loadCount: () => Promise<Array<{ value: number | string | bigint }>>,
): Promise<{ rows: T[]; total: number }> {
  const rows = await loadRows();
  const totals = await loadCount();
  return { rows, total: Number(totals[0]?.value ?? 0) };
}
