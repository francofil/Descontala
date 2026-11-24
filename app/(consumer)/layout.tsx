import { Suspense } from "react";
import { BottomNav, BottomNavView } from "@/components/consumer/bottom-nav";

export default function ConsumerLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto w-full min-w-0 max-w-md flex-1 px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-32">{children}</main>
      <Suspense fallback={<BottomNavView pathname="" />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
