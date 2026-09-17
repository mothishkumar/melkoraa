import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ImageManager } from "@/components/admin/image-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductDropAssociation } from "@/components/admin/product-drop-association";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminRefresh } from "@/hooks/use-admin-refresh";
import {
  getAdminProductRequest,
  listAdminCategoriesRequest,
  listAdminDropsRequest,
} from "@/lib/api/admin";
import { userFacingApiMessage } from "@/lib/api/client";
import type { AdminProductDetail, PublicCategory, PublicDropSummary } from "@/types/catalog";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tick } = useAdminRefresh();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [drops, setDrops] = useState<PublicDropSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      getAdminProductRequest(id),
      listAdminCategoriesRequest({ page: 1, pageSize: 50 }),
      listAdminDropsRequest({ page: 1, pageSize: 50 }),
    ])
      .then(([productData, categoryData, dropData]) => {
        if (!cancelled) {
          setProduct(productData);
          setCategories(categoryData.data);
          setDrops(dropData.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(userFacingApiMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading product…</p>;
  if (error || !product) return <p className="text-sm text-destructive">{error ?? "Product not found."}</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader title={product.name} description={product.slug} />
      <Tabs defaultValue="info">
        <TabsList variant="line" className="mb-6 max-w-full overflow-x-auto">
          <TabsTrigger value="info">Product</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="associations">Associations</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <ProductForm product={product} categories={categories} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantManager product={product} />
        </TabsContent>
        <TabsContent value="images">
          <ImageManager product={product} />
        </TabsContent>
        <TabsContent value="associations">
          <ProductDropAssociation productId={product.id} currentDrop={product.drop} drops={drops} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
