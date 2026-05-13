import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EmployeeForm } from "@/components/home/employee-form";

export default async function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-3xl transition-all duration-300">
        {/* Header */}
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
            Employee QR Generator
          </Badge>
        </div>

        <div className="max-w-md mx-auto w-full px-4">
          <EmployeeForm />
        </div>

        {/* Footer */}
        <div className="mt-8 pb-2 flex justify-center">
          <p className="text-[11px] font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 uppercase">
            © {new Date().getFullYear()} Space Textiles Pvt. Ltd.
          </p>
        </div>
      </div>
    </main>
  );
}
