import { NextRequest } from 'next/server';

// --- Helper for IP Verification --- 
// IMPORTANT: Get the official list of IPs/CIDRs from Cardcom Documentation and store in .env!

// Store in environment variables (e.g., CARDCOM_ALLOWED_IPS=ip1,cidr1,ip2,cidr2)
const allowedSourcesInput = process.env.CARDCOM_ALLOWED_IPS ?? '';
const allowedSources = allowedSourcesInput.split(',').map(s => s.trim()).filter(Boolean);

if (allowedSources.length === 0) {
    console.warn('SECURITY WARNING: No Cardcom allowed IPs/CIDRs configured (check CARDCOM_ALLOWED_IPS env variable and Cardcom documentation).');
}

// Helper function to check if an IP is within a CIDR range
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false; // Invalid CIDR bits

    const ipParts = ip.split('.').map(Number);
    const rangeParts = range.split('.').map(Number);
    if (ipParts.length !== 4 || rangeParts.length !== 4 || ipParts.some(isNaN) || rangeParts.some(isNaN)) {
      return false; // Invalid IP format
    }

    // Convert IPs to 32-bit integers
    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

    // Create subnet mask
    const mask = (-1 << (32 - bits)) >>> 0; // Use unsigned right shift

    // Check if network addresses match
    return (ipInt & mask) === (rangeInt & mask);
  } catch (e) {
    console.error(`Error checking CIDR ${cidr} for IP ${ip}:`, e);
    return false;
  }
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

  console.log(`Cardcom IP Verification: Checking IP: ${ip} against allowed sources: ${allowedSources.join(', ')}`); 

  // Check against each allowed source (IP or CIDR)
  for (const source of allowedSources) {
    if (source.includes('/')) { // It's likely a CIDR range
      if (isIpInCidr(ip, source)) {
        console.log(`Cardcom IP Verification: IP ${ip} matched CIDR ${source}.`);
        return true;
      }
    } else { // Assume it's a single IP
      if (ip === source) {
        console.log(`Cardcom IP Verification: IP ${ip} matched allowed IP ${source}.`);
        return true;
      }
    }
  }

  // If no match found after checking all sources
  console.warn(`Cardcom IP Verification: Denied IP: ${ip}. Not found in allowed sources.`);
  return false;
} 