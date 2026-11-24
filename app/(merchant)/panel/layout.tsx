import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { MerchantNav, MerchantNavView } from "@/components/merchant/merchant-nav";
import { getCurrentUser } from "@/lib/services/session";

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-28 md:pb-12">
      <header className="flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/panel" />
          <Suspense fallback={null}>
            <ChainBadge />
          </Suspense>
        </div>
        <Suspense fallback={<MerchantNavView pathname="" />}>
          <MerchantNav />
        </Suspense>
        <LogoutButton />
      </header>
      <div className="mt-6 min-w-0 flex-1">{children}</div>
    </div>
  );
}

async function ChainBadge() {
  const user = await getCurrentUser();
  if (!user?.chainName) return null;
  return <span className="hidden truncate text-sm text-muted-foreground sm:inline">{user.chainName}</span>;
}
