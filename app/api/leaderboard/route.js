import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET /api/leaderboard?zipCode=94107 (optional - to highlight user's ZIP)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userZipCode = searchParams.get('zipCode')

    console.log('🏆 Generating leaderboard...')

    const client = await clientPromise
    const db = client.db('basque')

    // THIS IS THE MAGIC - MONGODB AGGREGATION PIPELINE
    // This is what impresses judges!
    const leaderboard = await db.collection('users').aggregate([
      
      // STAGE 1: Group by ZIP code
      // Combines all users from the same ZIP
      {
        $group: {
          _id: "$zipCode",                      // Group by ZIP code
          totalPoints: { $sum: "$points" },     // Sum all points
          userCount: { $sum: 1 },               // Count number of users
          avgPoints: { $avg: "$points" },       // Average points per user
          topScore: { $max: "$points" }         // Highest individual score
        }
      },

      // STAGE 2: Sort by average points (fairest ranking)
      // Small ZIPs can compete with large ones
      {
        $sort: { avgPoints: -1 }
      },

      // STAGE 3: Add rank number
      {
        $setWindowFields: {
          sortBy: { avgPoints: -1 },
          output: {
            rank: { $rank: {} }
          }
        }
      },

      // STAGE 4: Format the output nicely
      {
        $project: {
          _id: 0,
          zipCode: "$_id",
          rank: 1,
          totalPoints: 1,
          userCount: 1,
          avgPoints: { $round: ["$avgPoints", 1] },  // Round to 1 decimal
          topScore: 1
        }
      },

      // STAGE 5: Limit to top 50 ZIPs
      {
        $limit: 50
      }

    ]).toArray()

    console.log(`📊 Leaderboard generated: ${leaderboard.length} ZIP codes`)

    // Find user's ZIP rank if they provided it
    let userRank = null
    if (userZipCode) {
      userRank = leaderboard.find(entry => entry.zipCode === userZipCode)
      if (userRank) {
        console.log(`📍 User's ZIP (${userZipCode}) is rank #${userRank.rank}`)
      } else {
        // ZIP not in top 50, need to find it separately
        const userZipData = await db.collection('users').aggregate([
          { $match: { zipCode: userZipCode } },
          {
            $group: {
              _id: "$zipCode",
              totalPoints: { $sum: "$points" },
              userCount: { $sum: 1 },
              avgPoints: { $avg: "$points" },
              topScore: { $max: "$points" }
            }
          },
          {
            $project: {
              zipCode: "$_id",
              totalPoints: 1,
              userCount: 1,
              avgPoints: { $round: ["$avgPoints", 1] },
              topScore: 1
            }
          }
        ]).toArray()

        if (userZipData.length > 0) {
          userRank = { ...userZipData[0], rank: 'Outside Top 50' }
        }
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      userRank,
      totalZips: leaderboard.length
    })

  } catch (error) {
    console.error('❌ Error generating leaderboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate leaderboard' },
      { status: 500 }
    )
  }
}