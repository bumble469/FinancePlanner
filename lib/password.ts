import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Industry standard for bcrypt

/**
 * Hash password with bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('[Password] Hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify password against hash
 * @param password Plain text password to check
 * @param hash Hashed password from database
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    console.error('[Password] Verification failed:', error);
    return false;
  }
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
