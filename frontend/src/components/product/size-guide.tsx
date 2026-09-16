
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SizeGuide({
  sizes,
  productName,
}: {
  sizes: string[];
  productName?: string;
}) {
  const uniqueSizes = Array.from(new Set(sizes.filter(Boolean)));
  const hasData = uniqueSizes.length > 0;

  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className="label-caps text-[0.6rem] text-[#6f6b66] underline underline-offset-4"
        aria-haspopup="dialog"
      >
        Size guide
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(90vh,32rem)] overflow-y-auto rounded-none border border-black/15 bg-[#f6f3ee] text-[#111] sm:max-w-md"
        aria-describedby="size-guide-copy"
      >
        <DialogHeader>
          <DialogTitle className="editorial-display text-xl tracking-[0.16em] uppercase">
            Size guide
          </DialogTitle>
          <DialogDescription id="size-guide-copy" className="text-sm leading-7 text-[#6f6b66]">
            {hasData
              ? `${productName ? `${productName} is` : "This piece is"} offered in ${uniqueSizes.join(", ")}. Measure a garment you already wear and match the closest listed size.`
              : "Fit notes and measurements for this piece will appear here when they are published."}
          </DialogDescription>
        </DialogHeader>
        {hasData ? (
          <ul className="flex flex-wrap gap-2" aria-label="Available sizes">
            {uniqueSizes.map((size) => (
              <li
                key={size}
                className="min-h-10 min-w-10 border border-black/20 px-3 text-center text-sm leading-10"
              >
                {size}
              </li>
            ))}
          </ul>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
