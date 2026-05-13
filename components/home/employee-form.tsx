"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchEmployeeData } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function EmployeeForm() {
  const router = useRouter();
  const { employeeData, setEmployeeData } = useAppStore();
  const [ecno, setEcno] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleFetchEmployee = async () => {
    if (!ecno.trim()) {
      setError("Please enter an EC number or employee number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchEmployeeData(ecno.trim());
      setEmployeeData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch employee data");
      setEmployeeData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = () => {
    if (employeeData) {
      router.push("/generate-qr");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleFetchEmployee();
    }
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {!employeeData && (
        <div className="space-y-1.5">
          <Label htmlFor="ecno" className="text-sm font-semibold text-slate-800">Employee Code</Label>
          <Input
            id="ecno"
            placeholder="Enter the Valid EC No"
            value={ecno}
            onChange={(e) => setEcno(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="h-10 text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-500 uppercase"
          />
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {employeeData && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 border-2 border-blue-200/50 shadow-inner space-y-2">
          <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">
            Employee Details
          </div>
          <div className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800">
            {employeeData.name || "N/A"}
          </div>
          <div className="text-sm text-slate-700 font-medium">
            {employeeData.designation}
          </div>
          <div className="text-sm text-blue-800 font-semibold">
            EC No: {employeeData.ecno}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        {!employeeData ? (
          <Button
            onClick={handleFetchEmployee}
            disabled={loading || !ecno.trim()}
            className="w-full h-10 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-lg border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-white">Fetching...</span>
              </>
            ) : (
              <span className="text-white">Next</span>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleGenerateQR}
              className="w-full h-10 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-lg border border-blue-500/20"
              size="lg"
            >
              <span className="text-white">Generate QR Code</span>
            </Button>
            <Button
              onClick={() => {
                setEcno("");
                setEmployeeData(null);
                setError(null);
              }}
              className="w-full h-10 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-700 hover:via-green-800 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-lg border border-emerald-500/20"
              size="lg"
            >
              <span className="text-white">Search Another</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
}
