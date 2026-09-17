export function AdminPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      <div className="mt-8 border border-dashed border-white/15 px-6 py-16 text-center">
        <p className="text-sm font-medium">Out of Phase 10 scope</p>
        <p className="mt-2 text-sm text-muted-foreground">This route is not part of the operations dashboard.</p>
      </div>
    </div>
  );
}
