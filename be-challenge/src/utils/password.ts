import bcrypt from "bcryptjs";
import FirebaseService from "../services/firebase";

/**
 * Password utility functions for hashing and validation
 */

/**
 * Hash a password using bcrypt with salt rounds of 12
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object with isValid boolean and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: "Password must be at least 8 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must be less than 128 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
}

/**
 * Validate username format and requirements
 * @param username - Username to validate
 * @returns object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long",
    };
  }

  if (username.length > 30) {
    return {
      isValid: false,
      error: "Username must be less than 30 characters long",
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      isValid: false,
      error:
        "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  if (/^\d/.test(username)) {
    return { isValid: false, error: "Username cannot start with a number" };
  }

  return { isValid: true };
}

/**
 * Check if username is unique in the database
 * @param username - Username to check
 * @returns Promise<boolean> - True if username is unique (not taken)
 */
export async function isUsernameUnique(username: string): Promise<boolean> {
  try {
    const firebaseService = FirebaseService.getInstance();
    const db = firebaseService.getFirestore();

    const querySnapshot = await db
      .collection("employees")
      .where("username", "==", username)
      .limit(1)
      .get();

    return querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    throw new Error("Failed to validate username uniqueness");
  }
}
