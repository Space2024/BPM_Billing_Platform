/**
 * Generate a unique security token
 * Combines timestamp, random values, and employee data for uniqueness
 */
export function generateSecurityToken(ecno: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    
    // Create a hash-like string from ecno
    let ecnoHash = 0;
    for (let i = 0; i < ecno.length; i++) {
        ecnoHash = ((ecnoHash << 5) - ecnoHash) + ecno.charCodeAt(i);
        ecnoHash = ecnoHash & ecnoHash;
    }
    const ecnoHashStr = Math.abs(ecnoHash).toString(36);
    
    // Combine all parts
    const token = `${timestamp}${randomPart}${ecnoHashStr}${randomPart2}`;
    
    return token;
}

/**
 * Store token with metadata in localStorage (for employee's device only)
 */
export function storeToken(token: string, ecno: string, branch: string): void {
    const tokenData = {
        token,
        ecno,
        branch,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    // Store in localStorage with token as key (for tracking on employee device)
    localStorage.setItem(`token_${token}`, JSON.stringify(tokenData));
    
    // Also maintain a list of active tokens for cleanup
    const activeTokens = getActiveTokens();
    activeTokens.push(token);
    localStorage.setItem('active_tokens', JSON.stringify(activeTokens));
    
    // Cleanup expired tokens
    cleanupExpiredTokens();
}

/**
 * Get active tokens list
 */
function getActiveTokens(): string[] {
    const stored = localStorage.getItem('active_tokens');
    return stored ? JSON.parse(stored) : [];
}

/**
 * Validate token format (basic structure validation)
 * This works across devices since it only checks the token structure
 */
export function validateTokenFormat(token: string): boolean {
    // Token should be a non-empty string with reasonable length
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    // Token should be between 20-100 characters (based on our generation logic)
    if (token.length < 20 || token.length > 100) {
        return false;
    }
    
    // Token should only contain alphanumeric characters (base36)
    if (!/^[a-z0-9]+$/i.test(token)) {
        return false;
    }
    
    return true;
}

/**
 * Validate a token (only works on device that generated it)
 */
export function validateToken(token: string): { valid: boolean; ecno?: string; branch?: string } {
    const stored = localStorage.getItem(`token_${token}`);
    
    if (!stored) {
        return { valid: false };
    }
    
    try {
        const tokenData = JSON.parse(stored);
        const expiresAt = new Date(tokenData.expiresAt);
        const now = new Date();
        
        if (now > expiresAt) {
            // Token expired
            localStorage.removeItem(`token_${token}`);
            return { valid: false };
        }
        
        return {
            valid: true,
            ecno: tokenData.ecno,
            branch: tokenData.branch
        };
    } catch (error) {
        return { valid: false };
    }
}

/**
 * Cleanup expired tokens
 */
function cleanupExpiredTokens(): void {
    const activeTokens = getActiveTokens();
    const validTokens: string[] = [];
    const now = new Date();
    
    activeTokens.forEach(token => {
        const stored = localStorage.getItem(`token_${token}`);
        if (stored) {
            try {
                const tokenData = JSON.parse(stored);
                const expiresAt = new Date(tokenData.expiresAt);
                
                if (now <= expiresAt) {
                    validTokens.push(token);
                } else {
                    localStorage.removeItem(`token_${token}`);
                }
            } catch (error) {
                localStorage.removeItem(`token_${token}`);
            }
        }
    });
    
    localStorage.setItem('active_tokens', JSON.stringify(validTokens));
}

/**
 * Get token data
 */
export function getTokenData(token: string): any {
    const stored = localStorage.getItem(`token_${token}`);
    return stored ? JSON.parse(stored) : null;
}
