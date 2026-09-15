-- RLS helpers, auth FKs, updated_at triggers, policies, and storage buckets.
-- Reviewed: no DROP TABLE. Historical commerce FKs remain RESTRICT / SET NULL.

-- ---------------------------------------------------------------------------
-- Auth foreign keys (applied only when Supabase auth.users exists)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE NOTICE 'auth.users not found; skipping auth foreign keys (expected outside Supabase).';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'addresses_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.addresses
      ADD CONSTRAINT addresses_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'carts_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.carts
      ADD CONSTRAINT carts_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wishlists_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.wishlists
      ADD CONSTRAINT wishlists_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_changed_by_fkey'
  ) THEN
    ALTER TABLE public.order_status_history
      ADD CONSTRAINT order_status_history_changed_by_fkey
      FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coupon_usages_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.coupon_usages
      ADD CONSTRAINT coupon_usages_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.audit_logs
      ADD CONSTRAINT audit_logs_user_id_auth_users_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'addresses',
    'categories',
    'collections',
    'drops',
    'products',
    'product_variants',
    'inventory',
    'carts',
    'cart_items',
    'wishlists',
    'orders',
    'payments',
    'coupons',
    'reviews'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER, bypasses RLS on profiles to avoid recursion)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = 'manager', false);
$$;

CREATE OR REPLACE FUNCTION public.has_staff_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() IN ('admin', 'manager', 'staff'), false);
$$;

CREATE OR REPLACE FUNCTION public.owns_cart(p_cart_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.carts
    WHERE id = p_cart_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_wishlist(p_wishlist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wishlists
    WHERE id = p_wishlist_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_order(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = p_order_id
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_staff_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_cart(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_wishlist(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_order(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_profile_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_staff_access() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_wishlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_order(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Profile + wishlist on signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wishlists (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
END
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS profiles_select_own_or_staff ON public.profiles;
CREATE POLICY profiles_select_own_or_staff
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS profiles_insert_self_customer ON public.profiles;
CREATE POLICY profiles_insert_self_customer
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'customer');

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND role = public.current_profile_role());

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- addresses
DROP POLICY IF EXISTS addresses_select_own_or_staff ON public.addresses;
CREATE POLICY addresses_select_own_or_staff
  ON public.addresses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS addresses_insert_own ON public.addresses;
CREATE POLICY addresses_insert_own
  ON public.addresses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_update_own ON public.addresses;
CREATE POLICY addresses_update_own
  ON public.addresses FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_delete_own ON public.addresses;
CREATE POLICY addresses_delete_own
  ON public.addresses FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS addresses_admin_all ON public.addresses;
CREATE POLICY addresses_admin_all
  ON public.addresses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- catalog: products
DROP POLICY IF EXISTS products_select_active ON public.products;
CREATE POLICY products_select_active
  ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS products_select_staff ON public.products;
CREATE POLICY products_select_staff
  ON public.products FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS products_write_managers ON public.products;
CREATE POLICY products_write_managers
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- product_variants
DROP POLICY IF EXISTS product_variants_select_public ON public.product_variants;
CREATE POLICY product_variants_select_public
  ON public.product_variants FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS product_variants_select_staff ON public.product_variants;
CREATE POLICY product_variants_select_staff
  ON public.product_variants FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS product_variants_write_managers ON public.product_variants;
CREATE POLICY product_variants_write_managers
  ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- product_images
DROP POLICY IF EXISTS product_images_select_public ON public.product_images;
CREATE POLICY product_images_select_public
  ON public.product_images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS product_images_select_staff ON public.product_images;
CREATE POLICY product_images_select_staff
  ON public.product_images FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS product_images_write_managers ON public.product_images;
CREATE POLICY product_images_write_managers
  ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- categories (public read; no status column)
DROP POLICY IF EXISTS categories_select_public ON public.categories;
CREATE POLICY categories_select_public
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS categories_write_managers ON public.categories;
CREATE POLICY categories_write_managers
  ON public.categories FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- collections
DROP POLICY IF EXISTS collections_select_active ON public.collections;
CREATE POLICY collections_select_active
  ON public.collections FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS collections_select_staff ON public.collections;
CREATE POLICY collections_select_staff
  ON public.collections FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS collections_write_managers ON public.collections;
CREATE POLICY collections_write_managers
  ON public.collections FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- drops
DROP POLICY IF EXISTS drops_select_active ON public.drops;
CREATE POLICY drops_select_active
  ON public.drops FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS drops_select_staff ON public.drops;
CREATE POLICY drops_select_staff
  ON public.drops FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS drops_write_managers ON public.drops;
CREATE POLICY drops_write_managers
  ON public.drops FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- product_categories
DROP POLICY IF EXISTS product_categories_select_public ON public.product_categories;
CREATE POLICY product_categories_select_public
  ON public.product_categories FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS product_categories_select_staff ON public.product_categories;
CREATE POLICY product_categories_select_staff
  ON public.product_categories FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS product_categories_write_managers ON public.product_categories;
CREATE POLICY product_categories_write_managers
  ON public.product_categories FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- drop_products
DROP POLICY IF EXISTS drop_products_select_public ON public.drop_products;
CREATE POLICY drop_products_select_public
  ON public.drop_products FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.drops d
      WHERE d.id = drop_id AND d.status = 'active'
    )
  );

DROP POLICY IF EXISTS drop_products_select_staff ON public.drop_products;
CREATE POLICY drop_products_select_staff
  ON public.drop_products FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS drop_products_write_managers ON public.drop_products;
CREATE POLICY drop_products_write_managers
  ON public.drop_products FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- product_editions
DROP POLICY IF EXISTS product_editions_select_public ON public.product_editions;
CREATE POLICY product_editions_select_public
  ON public.product_editions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS product_editions_select_staff ON public.product_editions;
CREATE POLICY product_editions_select_staff
  ON public.product_editions FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS product_editions_write_managers ON public.product_editions;
CREATE POLICY product_editions_write_managers
  ON public.product_editions FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- inventory (not public)
DROP POLICY IF EXISTS inventory_select_staff ON public.inventory;
CREATE POLICY inventory_select_staff
  ON public.inventory FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS inventory_write_managers ON public.inventory;
CREATE POLICY inventory_write_managers
  ON public.inventory FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- inventory_transactions (append-oriented)
DROP POLICY IF EXISTS inventory_transactions_select_staff ON public.inventory_transactions;
CREATE POLICY inventory_transactions_select_staff
  ON public.inventory_transactions FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS inventory_transactions_insert_managers ON public.inventory_transactions;
CREATE POLICY inventory_transactions_insert_managers
  ON public.inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_manager());

REVOKE UPDATE, DELETE ON public.inventory_transactions FROM anon, authenticated;

-- carts
DROP POLICY IF EXISTS carts_select_own_or_staff ON public.carts;
CREATE POLICY carts_select_own_or_staff
  ON public.carts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS carts_insert_own ON public.carts;
CREATE POLICY carts_insert_own
  ON public.carts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS carts_update_own ON public.carts;
CREATE POLICY carts_update_own
  ON public.carts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS carts_delete_own ON public.carts;
CREATE POLICY carts_delete_own
  ON public.carts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- cart_items
DROP POLICY IF EXISTS cart_items_select_own_or_staff ON public.cart_items;
CREATE POLICY cart_items_select_own_or_staff
  ON public.cart_items FOR SELECT TO authenticated
  USING (public.owns_cart(cart_id) OR public.has_staff_access());

DROP POLICY IF EXISTS cart_items_insert_own ON public.cart_items;
CREATE POLICY cart_items_insert_own
  ON public.cart_items FOR INSERT TO authenticated
  WITH CHECK (public.owns_cart(cart_id));

DROP POLICY IF EXISTS cart_items_update_own ON public.cart_items;
CREATE POLICY cart_items_update_own
  ON public.cart_items FOR UPDATE TO authenticated
  USING (public.owns_cart(cart_id))
  WITH CHECK (public.owns_cart(cart_id));

DROP POLICY IF EXISTS cart_items_delete_own ON public.cart_items;
CREATE POLICY cart_items_delete_own
  ON public.cart_items FOR DELETE TO authenticated
  USING (public.owns_cart(cart_id));

-- wishlists
DROP POLICY IF EXISTS wishlists_select_own_or_staff ON public.wishlists;
CREATE POLICY wishlists_select_own_or_staff
  ON public.wishlists FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS wishlists_insert_own ON public.wishlists;
CREATE POLICY wishlists_insert_own
  ON public.wishlists FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wishlists_update_own ON public.wishlists;
CREATE POLICY wishlists_update_own
  ON public.wishlists FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS wishlists_delete_own ON public.wishlists;
CREATE POLICY wishlists_delete_own
  ON public.wishlists FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- wishlist_items
DROP POLICY IF EXISTS wishlist_items_select_own_or_staff ON public.wishlist_items;
CREATE POLICY wishlist_items_select_own_or_staff
  ON public.wishlist_items FOR SELECT TO authenticated
  USING (public.owns_wishlist(wishlist_id) OR public.has_staff_access());

DROP POLICY IF EXISTS wishlist_items_insert_own ON public.wishlist_items;
CREATE POLICY wishlist_items_insert_own
  ON public.wishlist_items FOR INSERT TO authenticated
  WITH CHECK (public.owns_wishlist(wishlist_id));

DROP POLICY IF EXISTS wishlist_items_delete_own ON public.wishlist_items;
CREATE POLICY wishlist_items_delete_own
  ON public.wishlist_items FOR DELETE TO authenticated
  USING (public.owns_wishlist(wishlist_id));

-- orders (no customer delete; user_id SET NULL on account deletion)
DROP POLICY IF EXISTS orders_select_own_or_staff ON public.orders;
CREATE POLICY orders_select_own_or_staff
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS orders_insert_own ON public.orders;
CREATE POLICY orders_insert_own
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS orders_update_staff ON public.orders;
CREATE POLICY orders_update_staff
  ON public.orders FOR UPDATE TO authenticated
  USING (public.has_staff_access())
  WITH CHECK (public.has_staff_access());

DROP POLICY IF EXISTS orders_delete_admin ON public.orders;
CREATE POLICY orders_delete_admin
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- order_items
DROP POLICY IF EXISTS order_items_select_own_or_staff ON public.order_items;
CREATE POLICY order_items_select_own_or_staff
  ON public.order_items FOR SELECT TO authenticated
  USING (public.owns_order(order_id) OR public.has_staff_access());

DROP POLICY IF EXISTS order_items_write_staff ON public.order_items;
CREATE POLICY order_items_write_staff
  ON public.order_items FOR ALL TO authenticated
  USING (public.has_staff_access())
  WITH CHECK (public.has_staff_access());

-- order_status_history
DROP POLICY IF EXISTS order_status_history_select_own_or_staff ON public.order_status_history;
CREATE POLICY order_status_history_select_own_or_staff
  ON public.order_status_history FOR SELECT TO authenticated
  USING (public.owns_order(order_id) OR public.has_staff_access());

DROP POLICY IF EXISTS order_status_history_insert_staff ON public.order_status_history;
CREATE POLICY order_status_history_insert_staff
  ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_access());

-- payments
DROP POLICY IF EXISTS payments_select_own_or_staff ON public.payments;
CREATE POLICY payments_select_own_or_staff
  ON public.payments FOR SELECT TO authenticated
  USING (public.owns_order(order_id) OR public.has_staff_access());

DROP POLICY IF EXISTS payments_write_admin ON public.payments;
CREATE POLICY payments_write_admin
  ON public.payments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- coupons (not enumerable by customers)
DROP POLICY IF EXISTS coupons_select_staff ON public.coupons;
CREATE POLICY coupons_select_staff
  ON public.coupons FOR SELECT TO authenticated
  USING (public.has_staff_access());

DROP POLICY IF EXISTS coupons_write_managers ON public.coupons;
CREATE POLICY coupons_write_managers
  ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_manager())
  WITH CHECK (public.is_admin() OR public.is_manager());

-- coupon_usages
DROP POLICY IF EXISTS coupon_usages_select_own_or_staff ON public.coupon_usages;
CREATE POLICY coupon_usages_select_own_or_staff
  ON public.coupon_usages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS coupon_usages_insert_staff ON public.coupon_usages;
CREATE POLICY coupon_usages_insert_staff
  ON public.coupon_usages FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_access());

-- reviews
DROP POLICY IF EXISTS reviews_select_public_or_own ON public.reviews;
CREATE POLICY reviews_select_public_or_own
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.has_staff_access());

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reviews_update_own_pending ON public.reviews;
CREATE POLICY reviews_update_own_pending
  ON public.reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS reviews_moderate_staff ON public.reviews;
CREATE POLICY reviews_moderate_staff
  ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_staff_access())
  WITH CHECK (public.has_staff_access());

-- audit_logs append-only for staff insert; admin read
DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS audit_logs_insert_staff ON public.audit_logs;
CREATE POLICY audit_logs_insert_staff
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_access());

REVOKE UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.addresses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.carts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items FORCE ROW LEVEL SECURITY;

-- profiles and wishlists stay ENABLE RLS (not FORCE) so handle_new_user
-- (SECURITY DEFINER, table owner) can insert the signup rows.

-- ---------------------------------------------------------------------------
-- Storage buckets (Supabase only). Writes are never public.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE 'storage.buckets not found; skipping storage setup.';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('brand-assets', 'brand-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO UPDATE
    SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
END
$$;

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS storage_product_images_read ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_product_images_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'product-images')
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_brand_assets_read ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_brand_assets_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'brand-assets')
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_avatars_read ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_avatars_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars')
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_product_images_write ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_product_images_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'product-images'
        AND (public.is_admin() OR public.is_manager())
      )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_product_images_update ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_product_images_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'product-images' AND (public.is_admin() OR public.is_manager()))
      WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR public.is_manager()))
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_product_images_delete ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_product_images_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'product-images' AND (public.is_admin() OR public.is_manager()))
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_brand_assets_write ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_brand_assets_write ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'brand-assets' AND (public.is_admin() OR public.is_manager()))
      WITH CHECK (bucket_id = 'brand-assets' AND (public.is_admin() OR public.is_manager()))
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_avatars_insert_own ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_avatars_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND split_part(name, '/', 1) = auth.uid()::text
      )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_avatars_update_own ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_avatars_update_own ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
      WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS storage_avatars_delete_own ON storage.objects';
  EXECUTE $policy$
    CREATE POLICY storage_avatars_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
  $policy$;
END
$$;
