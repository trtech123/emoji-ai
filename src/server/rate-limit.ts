import { prisma } from "./db"

interface RateLimitResult {
  remaining: number
  reset: number
}

export async function checkRateLimit(ip: string, isIOS: boolean): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = isIOS 
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days
    : new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day

  const limit = isIOS ? 3 : 500

  // Count requests in the time window
  const count = await prisma.emoji.count({
    where: {
      createdAt: {
        gte: windowStart,
      },
      prompt: ip, // We'll use the prompt field to store the IP temporarily
    },
  })

  return {
    remaining: Math.max(0, limit - count),
    reset: windowStart.getTime() + (isIOS ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
  }
} 