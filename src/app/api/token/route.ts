import { Response } from "@/server/utils"
import { SignJWT } from "jose"
import { nanoid } from "nanoid"
import { type NextRequest } from "next/server"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const secret = process.env.API_SECRET

  const ip = request.ip ?? "127.0.0.1"
  const userAgent = request.headers.get("user-agent") || "unknown"
  const isIOS = /iPhone|iPad|iPod/.test(userAgent)

  const token = await new SignJWT({ ip, isIOS })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(nanoid())
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(secret ?? ""))

  return Response.success({ body: { token } })
}
