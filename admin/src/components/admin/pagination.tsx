import { Link } from "react-router-dom";

import { pageHref } from "@/components/admin/page-header";

export function AdminPagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link to={pageHref(basePath, params, page - 1)} className="hover:underline">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-muted-foreground">
        {page} / {totalPages}
      </p>
      {page < totalPages ? (
        <Link to={pageHref(basePath, params, page + 1)} className="hover:underline">
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
