import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// GET /api/user?userId=xxxxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching user:', userId)

    const client = await clientPromise
    const db = client.db('basque')

    // Fetch user from MongoDB
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', user.zipCode)

    // Return user data (excluding sensitive fields if any)
    return NextResponse.json({
      success: true,
      user: {
        zipCode: user.zipCode,
        transportation: user.transportation,
        diet: user.diet,
        homeEnergy: user.homeEnergy,
        thermostat: user.thermostat,
        recycling: user.recycling,
        waterUsage: user.waterUsage,
        flightsPerYear: user.flightsPerYear,
        homeSize: user.homeSize,
        wfhDays: user.wfhDays,
        points: user.points || 0,
        completedActions: user.completedActions || [],
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}