import { FoundationNotice } from "@/components/common/foundation-notice";

export const metadata = {
  title: "Journal",
};

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="JOURNAL"
        description="Editorial stories will appear here. There are no published entries in this foundation phase."
      />
    </div>
  );
}
