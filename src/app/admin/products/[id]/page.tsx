import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductDropAssociation } from "@/components/admin/product-drop-association";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { requireStaff } from "@/lib/auth/require-role";
import { listAdminCategories } from "@/server/services/catalog/category-service";
import { listAdminDrops } from "@/server/services/catalog/drop-service";
import { getAdminProduct } from "@/server/services/catalog/product-service";

export const metadata = { title: "Product" };

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  let product;
  try {
    product = await getAdminProduct(id);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!product) notFound();
  const categories = await listAdminCategories(1, 50);
  const drops = await listAdminDrops(1, 50);

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
          <ProductForm product={product} categories={categories.data} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantManager product={product} />
        </TabsContent>
        <TabsContent value="images">
          <ImageManager product={product} />
        </TabsContent>
        <TabsContent value="associations">
          <ProductDropAssociation
            productId={product.id}
            currentDrop={product.drop}
            drops={drops.data}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
