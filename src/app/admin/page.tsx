import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInr } from "@/lib/catalog/money";
import { getAdminDashboard } from "@/server/services/admin/dashboard-service";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboard();

  const cards = [
    { label: "Products", value: snapshot.products.total, hint: `${snapshot.products.active} active` },
    { label: "Out of stock", value: snapshot.inventory.outOfStock, hint: `${snapshot.inventory.lowStock} low` },
    { label: "Pending orders", value: snapshot.orders.pending, hint: `${snapshot.orders.confirmed} confirmed` },
    { label: "Paid orders", value: snapshot.orders.paid, hint: `${snapshot.orders.cancelled} cancelled` },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Dashboard"
        description="Operational snapshot from catalog, inventory, and order services. No revenue metrics are shown."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="rounded-2xl border-zinc-200 bg-white shadow-sm ring-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium">Recent orders</h2>
          {snapshot.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="admin-panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`} className="underline-offset-4 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusPill value={order.status} />
                      </TableCell>
                      <TableCell>
                        <StatusPill value={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatInr(order.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium">Recent inventory</h2>
          {snapshot.recentInventory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory activity yet.</p>
          ) : (
            <div className="admin-panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.recentInventory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{entry.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
