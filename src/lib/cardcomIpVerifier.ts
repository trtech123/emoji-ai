import { NextRequest } from 'next/server';

// --- Helper for IP Verification --- 
// IMPORTANT: Get the official list of IPs from Cardcom Documentation and store in .env!
const DEFAULT_ALLOWED_IPS: string[] = [
  // Add known Cardcom IPs here as a fallback ONLY if env var is missing
  // '79.182.180.10', // Example - REPLACE with actual Cardcom IPs
];

// Store in environment variables (e.g., CARDCOM_ALLOWED_IPS=ip1,ip2,ip3)
const envIps = process.env.CARDCOM_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean);
const effectiveAllowedIps = new Set<string>(envIps?.length ? envIps : DEFAULT_ALLOWED_IPS);

if (effectiveAllowedIps.size === 0) {
    console.warn('SECURITY WARNING: No Cardcom allowed IPs configured (check CARDCOM_ALLOWED_IPS env variable and Cardcom documentation).');
}

export function verifyCardcomIp(request: NextRequest): boolean {
  // Prefer 'x-vercel-forwarded-for' on Vercel, fallback to others
  let ip = request.headers.get('x-vercel-forwarded-for') || request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

  // Handle potential comma-separated IPs in x-forwarded-for
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  if (!ip) {
    console.warn("Cardcom IP Verification: Could not determine request IP.");
    return false;
  }

  console.log(`Cardcom IP Verification: Checking IP: ${ip}`); 
  const isAllowed = effectiveAllowedIps.has(ip);
  if (!isAllowed) {
     console.warn(`Cardcom IP Verification: Denied IP: ${ip}. Allowed IPs: ${Array.from(effectiveAllowedIps).join(', ')}`);
  }
  return isAllowed;
} 