import QRCode from "qrcode";
import { QRData } from "@/types/employee";
import { generateSecurityToken, storeToken } from "./security-token";

/**
 * Generate a QR code as a data URL with unique security token
 * @param data - The data to encode in the QR code
 * @returns Promise resolving to a base64 data URL
 */
export async function generateQRCode(data: QRData): Promise<string> {
    try {
        // Generate unique security token
        const securityToken = generateSecurityToken(data.ecno);
        
        // Store token with metadata
        const branch = data.branch || "TCS";
        storeToken(securityToken, data.ecno, branch);
        
        // Generate QR code with Customer page link including ecno, branch, and security token
        const customerPageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/customer/${data.ecno}/${branch}?token=${securityToken}`;

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(customerPageUrl, {
            width: 400,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        return qrDataUrl;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw new Error("Failed to generate QR code");
    }
}

/**
 * Download a QR code image
 * @param dataUrl - The QR code data URL
 * @param filename - The filename for the download
 */
export function downloadQRCode(dataUrl: string, filename: string): void {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
