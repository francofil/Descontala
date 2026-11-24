import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-10">
      <Logo />
      <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
    </main>
  );
}
