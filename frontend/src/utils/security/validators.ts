/**
 * Input Validation Functions
 * Comprehensive validation utilities for form inputs and user data
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Address validation function
 */
export function validateAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  
  const cleaned = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(cleaned);
}

/**
 * Positive number validation
 */
export function validatePositiveNumber(value: string): boolean {
  if (typeof value !== 'string' || value === '') {
    return false;
  }
  
  // Check for invalid formats first
  if (value.includes('e') || value.includes('E')) {
    return false; // No scientific notation
  }
  
  if ((value.match(/\./g) || []).length > 1) {
    return false; // Multiple decimal points
  }
  
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * URL validation
 */
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url.trim());
    return ['https:', 'http:', 'ipfs:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Comprehensive input validator
 */
export function validateInput(value: any, rules: any): ValidationResult {
  if (rules.required && (!value || value === '')) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: rules.message || 'Invalid format' };
  }
  
  if (rules.min !== undefined || rules.max !== undefined) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: 'Must be a valid number' };
    }
    
    if (rules.min !== undefined && num < rules.min) {
      return { isValid: false, error: `Minimum value is ${rules.min}` };
    }
    
    if (rules.max !== undefined && num > rules.max) {
      return { isValid: false, error: `Maximum value is ${rules.max}` };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate multiple fields
 */
export function validateFields(data: Record<string, any>, rules: Record<string, any>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    results[field] = validateInput(data[field], fieldRules);
  }
  
  return results;
}

/**
 * Check if all validations passed
 */
export function isValidationPassed(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.isValid);
}