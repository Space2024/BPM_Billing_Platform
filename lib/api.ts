import { EmployeeData, ApiResponse } from "@/types/employee";
import { generateRequestId, getUserId, getSessionId } from "@/lib/user-id";

const API_URL = "https://servicehub.spacetextiles.net/parkingsystem/v1/Parking-tcs-employee-data/";
const AUTH_TOKEN = "d74e48fa5689bf56d3b63cffcd20e7b4e7399488";

export async function fetchEmployeeData(ecno: string): Promise<EmployeeData> {
    try {
        // Generate unique identifiers for this request
        const requestId = generateRequestId();
        const userId = getUserId();
        const sessionId = getSessionId();
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${AUTH_TOKEN}`,
                // Add unique identifiers to prevent duplicates
                "X-Request-ID": requestId,
                "X-User-ID": userId,
                "X-Session-ID": sessionId,
            },
            body: JSON.stringify({ ecno }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch employee data: ${response.statusText}`);
        }

        const apiResponse: ApiResponse = await response.json();

        // Check if the API returned success
        if (apiResponse.Status !== "Success") {
            throw new Error(apiResponse.Message || "Failed to fetch employee data");
        }

        // Check if we have data
        if (!apiResponse.Data || apiResponse.Data.length === 0) {
            throw new Error("No employee found with this EC number");
        }

        // Get the first employee from the Data array
        const employeeApiData = apiResponse.Data[0];

        // Normalize the data to our app's format
        const employeeData: EmployeeData = {
            ecno: employeeApiData.ECNO,
            name: employeeApiData.ENAME,
            status: employeeApiData.ATTN_STATUS,
            designation: employeeApiData.DESIGNATIONNAME,
            branch: employeeApiData.BRANCH || "TCS",
        };

        return employeeData;
    } catch (error) {
        console.error("Error fetching employee data:", error);
        throw error;
    }
}
