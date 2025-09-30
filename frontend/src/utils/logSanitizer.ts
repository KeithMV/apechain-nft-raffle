/**
 * Log sanitization utility to prevent log injection attacks (CWE-117)
 */

/**
 * Sanitizes user input before logging to prevent log injection
 * Removes/encodes newlines, carriage returns, and other control characters
 */
export function sanitizeForLog(input: any): string {
  if (input === null || input === undefined) {
    return 'null';
  }
  
  const str = String(input);
  
  // Remove or encode dangerous characters that could break log integrity
  return str
    .replace(/\r/g, '\\r')     // Carriage return
    .replace(/\n/g, '\\n')     // Newline
    .replace(/\t/g, '\\t')     // Tab
    .replace(/\x00/g, '\\0')   // Null byte
    .replace(/\x1b/g, '\\x1b') // Escape character
    .slice(0, 1000);           // Limit length to prevent log flooding
}

/**
 * Safe console.log wrapper that sanitizes all inputs
 */
export function safeLog(...args: any[]): void {
  const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
  console.log(...sanitizedArgs);
}

/**
 * Safe console.error wrapper that sanitizes all inputs
 */
export function safeError(...args: any[]): void {
  const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
  console.error(...sanitizedArgs);
}