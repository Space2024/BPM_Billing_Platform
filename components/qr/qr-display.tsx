"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateQRCode, downloadQRCode } from "@/lib/qr-generator";
import { getCurrentDate } from "@/lib/serial-number";
import { useAppStore } from "@/lib/store";
import { Download, Home, Loader2 } from "lucide-react";

export function QRDisplay() {
    const router = useRouter();
    const { employeeData, qrCodeUrl, setQrCodeUrl, setEmployeeData } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!employeeData) {
            router.push("/");
            return;
        }

        if (!qrCodeUrl) {
            generateQRCode({
                ecno: employeeData.ecno,
                employeeName: employeeData.name,
                serialNumber: 0,
                date: getCurrentDate(),
                branch: employeeData.branch,
            })
                .then((url) => {
                    setQrCodeUrl(url);
                    setLoading(false);
                })
                .catch((err) => {
                    setError(err instanceof Error ? err.message : "Failed to generate QR code");
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [employeeData, qrCodeUrl, router, setQrCodeUrl]);

    const handleDownload = () => {
        if (qrCodeUrl && employeeData) {
            const filename = `QR_${employeeData.ecno}_${getCurrentDate()}.png`;
            downloadQRCode(qrCodeUrl, filename);
        }
    };

    const handleGenerateAnother = () => {
        // Clear employee data and QR code from store
        setEmployeeData(null);
        setQrCodeUrl(null);
        router.push("/");
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-slate-600 font-medium">Generating QR code...</p>
                </div>
            </main>
        );
    }

    if (error || !employeeData || !qrCodeUrl) {
        return (
            <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-4">
                    <h2 className="text-xl font-bold text-red-600">Error</h2>
                    <p className="text-slate-600">
                        {error || "Failed to generate QR code"}
                    </p>
                    <Button onClick={handleGenerateAnother} className="w-full mt-4">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl transition-all duration-300">
                {/* Header */}
                <div className="flex flex-col items-center gap-1.5 pb-4">
                    <Image
                        src="/blupeacock3.png"
                        alt="Company Logo"
                        width={260}
                        height={260}
                        priority
                        className="object-contain"
                    />
                    <div className="bg-slate-100 text-slate-500 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mt-1">
                        QR Code Generated
                    </div>
                    <div className="text-[10px] text-slate-400">
                        {getCurrentDate()}
                    </div>
                </div>

                <div className="max-w-md mx-auto w-full px-4 space-y-4">
                    {/* Employee Details Box */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-1">
                        <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-0.5">
                            Employee Details
                        </div>
                        <div className="text-base font-extrabold text-slate-800 leading-tight">
                            {employeeData.name}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                            {employeeData.designation}
                        </div>
                        <div className="text-xs text-blue-700 font-semibold mt-0.5">
                            EC No: {employeeData.ecno}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <img
                            src={qrCodeUrl}
                            alt="Employee QR Code"
                            className="w-56 h-56 object-contain"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5">
                        <Button
                            onClick={handleDownload}
                            className="w-full h-11 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm rounded-xl"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button
                            onClick={handleGenerateAnother}
                            className="w-full h-11 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm rounded-xl"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Generate Another
                        </Button>
                    </div>
                </div>
                
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
