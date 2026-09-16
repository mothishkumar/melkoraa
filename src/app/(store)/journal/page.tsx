import { FoundationNotice } from "@/components/common/foundation-notice";
import { StoreSurface } from "@/components/layout/store-surface";

export const metadata = {
  title: "Journal",
};

export default function JournalPage() {
  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
        <FoundationNotice
          title="JOURNAL"
          description="Editorial stories will appear here. There are no published entries in this foundation phase."
        />
      </div>
    </StoreSurface>
  );
}
