import { prisma } from "@/server/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try to connect to the database
    await prisma.$connect()
    
    // Try to query the database
    const count = await prisma.emoji.count()
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful',
      count
    })
  } catch (error) {
    console.error('Error testing Prisma connection:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 