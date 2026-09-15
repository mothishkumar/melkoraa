import { brand } from "@/lib/brand";

export const metadata = {
  title: "Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="label-caps">Overview</p>
      <h1 className="editorial-display mt-3 text-4xl">Dashboard</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone">
        Revenue, orders, customers, and inventory widgets will appear here after catalog
        and order services exist. No sample metrics are shown.
      </p>
      <div className="mt-12 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        {["Revenue", "Orders", "Customers", "Products", "Average order", "Low stock"].map(
          (label) => (
            <div key={label} className="bg-black px-6 py-8">
              <p className="label-caps">{label}</p>
              <p className="mt-4 font-heading text-2xl">—</p>
            </div>
          ),
        )}
      </div>
      <p className="mt-10 text-xs tracking-[0.18em] uppercase text-stone">
        {brand.name} operations — Phase 1
      </p>
    </div>
  );
}
