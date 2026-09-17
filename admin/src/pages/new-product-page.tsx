import { useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminCategoriesRequest } from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { PublicCategory } from "@/types/catalog";

export function NewProductPage() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listAdminCategoriesRequest({ page: 1, pageSize: 50 })
      .then((result) => setCategories(result.data))
      .catch((err) => setError(userFacingApiMessage(err)));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader title="New product" description="Creates a catalog row through POST /api/v1/admin/products." />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <ProductForm categories={categories} />
    </div>
  );
}
