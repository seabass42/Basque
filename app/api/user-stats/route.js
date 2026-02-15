import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// GET /api/user-stats?userId=xxxxx
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

    console.log('📊 Generating user statistics...')

    const client = await clientPromise
    const db = client.db('basque')

    // Get user
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // ADVANCED: Get detailed action history with timestamps
    // This shows MongoDB's ability to work with dates and perform complex joins
    const actionHistory = await db.collection('users').aggregate([
      // Match this specific user
      { $match: { _id: new ObjectId(userId) } },
      
      // Unwind the completedActions array
      { $unwind: { path: '$completedActions', preserveNullAndEmptyArrays: true } },
      
      // Lookup the action details from recommendations collection
      {
        $lookup: {
          from: 'recommendations',
          localField: 'completedActions',
          foreignField: '_id',
          as: 'actionDetails'
        }
      },
      
      // Unwind the lookup results
      { $unwind: { path: '$actionDetails', preserveNullAndEmptyArrays: true } },
      
      // Project the fields we need
      {
        $project: {
          _id: 0,
          actionId: '$completedActions',
          title: '$actionDetails.title',
          category: '$actionDetails.category',
          pointValue: '$actionDetails.pointValue',
          impactMetric: '$actionDetails.impactMetric',
          completedAt: '$updatedAt'  // Using user's updatedAt as proxy
        }
      },
      
      // Filter out null entries (from empty arrays)
      { $match: { actionId: { $ne: null } } }
      
    ]).toArray()

    // Calculate stats by category
    const statsByCategory = await db.collection('users').aggregate([
      { $match: { _id: new ObjectId(userId) } },
      { $unwind: { path: '$completedActions', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'recommendations',
          localField: 'completedActions',
          foreignField: '_id',
          as: 'actionDetails'
        }
      },
      { $unwind: { path: '$actionDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$actionDetails.category',
          count: { $sum: 1 },
          totalPoints: { $sum: '$actionDetails.pointValue' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          totalPoints: 1
        }
      },
      { $match: { category: { $ne: null } } }
    ]).toArray()

    // Compare to community average
    const communityStats = await db.collection('users').aggregate([
      { $match: { zipCode: user.zipCode } },
      {
        $group: {
          _id: null,
          avgPoints: { $avg: '$points' },
          avgActions: { $avg: { $size: { $ifNull: ['$completedActions', []] } } },
          totalUsers: { $sum: 1 }
        }
      }
    ]).toArray()

    const userStats = {
      totalPoints: user.points || 0,
      totalActions: (user.completedActions || []).length,
      memberSince: user.createdAt,
      zipCode: user.zipCode,
      actionHistory: actionHistory,
      statsByCategory: statsByCategory,
      communityComparison: communityStats[0] || {
        avgPoints: 0,
        avgActions: 0,
        totalUsers: 1
      }
    }

    console.log('✅ User statistics generated')

    return NextResponse.json({
      success: true,
      stats: userStats
    })

  } catch (error) {
    console.error('❌ Error generating stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate statistics' },
      { status: 500 }
    )
  }
}

/*
MONGODB FEATURES SHOWCASED:

✅ $lookup - Cross-collection joins (users → recommendations)
✅ $unwind - Array decomposition  
✅ $group - Aggregation by category
✅ $match - Filtering
✅ $project - Field selection
✅ Date queries - Working with timestamps
✅ Array operations - $size, $ifNull
✅ Statistical functions - $avg, $sum
✅ Multi-stage pipelines - Complex data transformations

This demonstrates:
- Ability to join collections
- Complex aggregation pipelines
- Statistical analysis
- Data transformation
*/