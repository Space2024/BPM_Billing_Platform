// SSR — /customer/{ecno}/{branch}?token=... (QR code entry point)
// Suspense streaming: page shell renders INSTANTLY, stores load in background
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllStores } from "@/lib/billing-graphql";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ ecno: string; branch: string }>;
  searchParams: Promise<{ token?: string }>;
}

// Async server component — fetches stores (cached 1h), then hydrates the shell
async function ShellWithStores({ ecno }: { ecno: string }) {
  const stores = await getAllStores();
  return <CustomerShell stores={stores} staffEcno={ecno} />;
}

export default async function QRCustomerPage({ params, searchParams }: PageProps) {
  const { ecno } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const decodedEcno = decodeURIComponent(ecno);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl transition-all duration-300">
        {/* Header — always instant (no data dependency) */}
        <div className="flex flex-col items-center gap-3 pb-6">
          <Image
            src="/blupeacock3.png"
            alt="Logo"
            width={280}
            height={280}
            priority
            className="object-contain"
          />
          <Separator className="w-16" />
          <Badge variant="secondary" className="text-xs font-semibold tracking-widest uppercase px-3 py-1 bg-slate-100 text-slate-500 border-0">
            Customer Billing Platform
          </Badge>
        </div>

        {/*
          Suspense: renders the shell immediately with empty stores (mobile entry
          step works fully without stores). Stores stream in when cached response
          arrives — only needed at the registration step.
        */}
        <Suspense fallback={<CustomerShell stores={[]} staffEcno={decodedEcno} />}>
          <ShellWithStores ecno={decodedEcno} />
        </Suspense>

        {/* Footer */}
        <div className="mt-8 pb-4 flex justify-center">
          <p className="text-[11px] font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 uppercase">
            © {new Date().getFullYear()} Space Textiles Pvt. Ltd.
          </p>
        </div>
      </div>
    </main>
  );
}
