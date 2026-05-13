// API Response structure
export interface ApiResponse {
    Status: string;
    Message: string;
    Count?: number;
    Data: ApiEmployeeData[];
    Data_Type?: string;
}

// Employee data from API
export interface ApiEmployeeData {
    ECNO: string;
    ENAME: string;
    ATTN_STATUS: string;
    DESIGNATIONNAME: string;
    BRANCH?: string;
}

// Normalized employee data for the app
export interface EmployeeData {
    ecno: string;
    name: string;
    status: string;
    designation: string;
    branch?: string;
}

// QR code data structure
export interface QRData {
    ecno: string;
    employeeName: string;
    serialNumber: number;
    date: string;
    branch?: string;
}

// Serial number tracking structure
export interface SerialNumberData {
    date: string;
    lastSerial: number;
}

// Employee serial number tracking by EC number and date
export interface EmployeeSerialData {
    [ecno: string]: {
        [date: string]: number;
    };
}

// Customer token data
export interface CustomerToken {
    ecno: string;
    branch: string;
    mobileNumber: string;
    serialNumber: number;
    date: string;
    timestamp: string;
}
