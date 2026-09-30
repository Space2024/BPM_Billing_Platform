import { EmployeeData, ApiResponse } from "@/types/employee";
import {
  BLUPEACOCK_EMPLOYEE_DIRECTORY,
  BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN,
} from "@/app/composition/configuration";

// Endpoint and token come from the composition layer, so nothing here reads
// process.env or carries a hardcoded address.
const API_URL = BLUPEACOCK_EMPLOYEE_DIRECTORY;
const AUTH_TOKEN = BLUPEACOCK_EMPLOYEE_DIRECTORY_TOKEN;

export async function fetchEmployeeData(ecno: string): Promise<EmployeeData> {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${AUTH_TOKEN}`,
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
