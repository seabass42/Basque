import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// GET /api/tasks?userId=xxxxx
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

    console.log('📋 Fetching personalized tasks for user:', userId)

    const client = await clientPromise
    const db = client.db('basque')

    // Get user data
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Build query to find matching recommendations
    const matchQuery = {
      $or: []
    }

    // Match based on user's answers
    if (user.transportation) {
      matchQuery.$or.push({ "showIf.transportation": user.transportation })
    }
    if (user.diet) {
      matchQuery.$or.push({ "showIf.diet": user.diet })
    }

    // Include universal recommendations (empty showIf)
    matchQuery.$or.push({ showIf: { $eq: {} } })

    console.log('🔍 Query:', JSON.stringify(matchQuery, null, 2))

    // Get all matching recommendations
    const allTasks = await db.collection('recommendations').find(matchQuery).toArray()

    // Filter out already completed tasks
    const completedIds = (user.completedActions || []).map(id => id.toString())
    const availableTasks = allTasks.filter(task => 
      !completedIds.includes(task._id.toString())
    )

    // Sort by point value (highest first)
    const sortedTasks = availableTasks.sort((a, b) => b.pointValue - a.pointValue)

    // Limit to top 8 tasks
    const topTasks = sortedTasks.slice(0, 8)

    // Format for frontend
    const formattedTasks = topTasks.map(task => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      category: task.category,
      pointValue: task.pointValue,
      impactMetric: task.impactMetric,
      difficulty: task.difficulty
    }))

    console.log(`✅ Found ${formattedTasks.length} available tasks`)

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      completedCount: completedIds.length,
      totalPoints: user.points || 0
    })

  } catch (error) {
    console.error('❌ Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}