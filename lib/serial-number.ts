const COUNTER_KEY = "globalDailyCounter";
const API_URL = "https://cust.spacetextiles.net/follow";

interface GlobalDailyCounter {
    date: string;
    counter: number;
    lastSynced?: string;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split("T")[0];
}

/**
 * Fetch last memento number from backend API
 */
async function fetchLastMementoFromAPI(): Promise<number> {
    try {
        console.log('Fetching last memento from API:', API_URL);
        const response = await fetch(API_URL);
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            console.warn('Failed to fetch last memento from API, status:', response.status);
            return 0;
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success && data.data) {
            const entryDate = data.data.entry_date;
            const mementoNo = data.data.memento_no;
            const today = getCurrentDate();
            
            console.log('Last memento from API:', mementoNo, 'Date:', entryDate, 'Today:', today);
            
            // Check if the last memento is from today
            if (entryDate === today) {
                // Return the memento number from API (0 means no records, start from 0)
                console.log('Using memento number from API:', mementoNo);
                return mementoNo || 0;
            }
        }
        
        console.log('No memento found for today, starting from 0');
        return 0;
    } catch (error) {
        console.error('Error fetching last memento from API:', error);
        return 0;
    }
}

/**
 * Get or initialize global daily counter with API sync
 */
async function getGlobalDailyCounter(): Promise<GlobalDailyCounter> {
    console.log('Getting global daily counter...');
    const today = getCurrentDate();
    const storedCounter = localStorage.getItem(COUNTER_KEY);
    
    if (storedCounter) {
        const counter: GlobalDailyCounter = JSON.parse(storedCounter);
        console.log('Found stored counter:', counter);
        
        // If it's a new day, fetch from API and reset (always trust API for new day)
        if (counter.date !== today) {
            console.log('New day detected, fetching from API and resetting...');
            const lastMementoNo = await fetchLastMementoFromAPI();
            const newCounter = {
                date: today,
                counter: lastMementoNo,
                lastSynced: new Date().toISOString()
            };
            // Save immediately to prevent using old counter
            saveGlobalDailyCounter(newCounter);
            return newCounter;
        }
        
        // If same day but not synced recently (more than 1 minute), sync with API
        const lastSyncTime = counter.lastSynced ? new Date(counter.lastSynced).getTime() : 0;
        const now = new Date().getTime();
        const oneMinute = 1 * 60 * 1000; // Changed from 5 minutes to 1 minute for more frequent sync
        
        if (now - lastSyncTime > oneMinute) {
            console.log('Syncing with API (1 minute passed)...');
            const lastMementoNo = await fetchLastMementoFromAPI();
            // Always use API value if it's higher (someone else might have generated mementos)
            const syncedCounter = {
                date: today,
                counter: Math.max(counter.counter, lastMementoNo),
                lastSynced: new Date().toISOString()
            };
            saveGlobalDailyCounter(syncedCounter);
            return syncedCounter;
        }
        
        console.log('Using stored counter (recently synced)');
        return counter;
    }
    
    // No stored counter, fetch from API
    console.log('No stored counter, fetching from API...');
    const lastMementoNo = await fetchLastMementoFromAPI();
    const newCounter = {
        date: today,
        counter: lastMementoNo,
        lastSynced: new Date().toISOString()
    };
    saveGlobalDailyCounter(newCounter);
    return newCounter;
}

/**
 * Save global daily counter
 */
function saveGlobalDailyCounter(counter: GlobalDailyCounter): void {
    localStorage.setItem(COUNTER_KEY, JSON.stringify(counter));
}

/**
 * Get the next serial number (global counter, not per employee)
 * Syncs with backend API to ensure continuity
 * Each customer gets a unique serial number regardless of which employee they interact with
 * Counter resets daily
 */
export async function getSerialForEmployee(ecno: string): Promise<number> {
    // Get global counter (with API sync)
    const globalCounter = await getGlobalDailyCounter();
    
    // Increment counter for new serial
    globalCounter.counter++;
    const newSerial = globalCounter.counter;
    
    // Save counter
    saveGlobalDailyCounter(globalCounter);
    
    return newSerial;
}

/**
 * Get the next serial number for a specific employee on current date
 * This is an alias for getSerialForEmployee for backward compatibility
 */
export async function getNextSerialForEmployee(ecno: string): Promise<number> {
    return await getSerialForEmployee(ecno);
}

/**
 * Get current global counter value (for display/debugging)
 */
export async function getCurrentGlobalCounter(): Promise<number> {
    const globalCounter = await getGlobalDailyCounter();
    return globalCounter.counter;
}

/**
 * Force sync with API
 */
export async function forceSyncWithAPI(): Promise<void> {
    const today = getCurrentDate();
    const lastMementoNo = await fetchLastMementoFromAPI();
    const counter: GlobalDailyCounter = {
        date: today,
        counter: lastMementoNo,
        lastSynced: new Date().toISOString()
    };
    saveGlobalDailyCounter(counter);
}

/**
 * Reset counter manually (for testing or admin purposes)
 */
export function resetDailyCounter(): void {
    const today = getCurrentDate();
    const counter: GlobalDailyCounter = {
        date: today,
        counter: 0,
        lastSynced: new Date().toISOString()
    };
    saveGlobalDailyCounter(counter);
    console.log('Counter reset to 0 for today');
}

/**
 * Clear all localStorage data for serial numbers (for debugging)
 */
export function clearAllSerialData(): void {
    localStorage.removeItem(COUNTER_KEY);
    console.log('All serial number data cleared from localStorage');
}

