import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

interface CustomJWTPayload extends JWTPayload {
  userId: string;
  // Add any other custom claims you need, e.g., roles
  // roles?: string[];
}

const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  // This error will be thrown at build time or server start if JWT_SECRET is not set
  // For Vercel, ensure JWT_SECRET is in your environment variables.
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
  // Optionally, you could throw an error here to prevent the app from starting/building
  // without this crucial configuration, but be mindful of build processes.
  // throw new Error('JWT_SECRET environment variable is not set.');
}

// Encode the key only if secretKey is defined. This avoids errors during build if the var is missing.
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : undefined;

export async function signJwt(
  payload: CustomJWTPayload,
  expiresIn: string | number = '1h' // Default to 1 hour
): Promise<string> {
  if (!encodedKey) {
    console.error("JWT signing failed: JWT_SECRET is not configured.");
    throw new Error("JWT_SECRET is not configured. Cannot sign token.");
  }
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(encodedKey);
    return token;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Could not sign JWT.');
  }
}

export async function verifyJwt<T extends CustomJWTPayload>(
  token: string
): Promise<T | null> {
  if (!encodedKey) {
    console.error("JWT verification failed: JWT_SECRET is not configured.");
    // Do not throw here as this function might be called in middleware
    // where returning null is the expected behavior for a missing/invalid token.
    return null;
  }
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify<T>(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // console.warn('JWT Verification Error:', error.message); // More subtle logging
    // Specific error codes like 'ERR_JWT_EXPIRED', 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' can be checked here
    // For example: if (error.code === 'ERR_JWT_EXPIRED') { console.log('Token expired'); }
    return null;
  }
} 