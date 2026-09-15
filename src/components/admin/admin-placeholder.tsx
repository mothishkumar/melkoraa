export function AdminPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="label-caps">Admin</p>
      <h1 className="editorial-display mt-3 text-4xl">{title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone">{description}</p>
      <div className="mt-10 border border-dashed border-white/15 px-6 py-16 text-center">
        <p className="label-caps">No records</p>
        <p className="mt-3 text-sm text-stone">This module is not connected to data yet.</p>
      </div>
    </div>
  );
}
