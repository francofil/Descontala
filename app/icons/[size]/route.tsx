import { brandIcon } from "@/lib/brand-icon";

const SIZES: Record<string, { px: number; maskable: boolean }> = {
  "192.png": { px: 192, maskable: false },
  "512.png": { px: 512, maskable: false },
  "maskable-512.png": { px: 512, maskable: true },
};

export async function GET(_: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  const spec = SIZES[size];
  if (!spec) return new Response("No encontrado", { status: 404 });
  const res = brandIcon(spec.px, { maskable: spec.maskable });
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
}
