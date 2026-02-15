import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// Simple ZIP to state mapping for common ZIPs
const ZIP_TO_COORDS = {
  '94107': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', state: 'CA' },
  '10001': { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'NY' },
  '90210': { lat: 34.0522, lng: -118.2437, city: 'Beverly Hills', state: 'CA' },
  '02108': { lat: 42.3601, lng: -71.0589, city: 'Boston', state: 'MA' },
  '60601': { lat: 41.8781, lng: -87.6298, city: 'Chicago', state: 'IL' },
  '78701': { lat: 30.2672, lng: -97.7431, city: 'Austin', state: 'TX' },
  '98101': { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA' },
  '33101': { lat: 25.7617, lng: -80.1918, city: 'Miami', state: 'FL' }
}

// GET /api/map-data
export async function GET(request) {
  try {
    console.log('📍 Fetching map data...')

    const client = await clientPromise
    const db = client.db('basque')

    // MONGODB AGGREGATION: Get all ZIP codes with their stats
    const mapData = await db.collection('users').aggregate([
      {
        // Group by ZIP code
        $group: {
          _id: "$zipCode",
          totalPoints: { $sum: "$points" },
          userCount: { $sum: 1 },
          avgPoints: { $avg: "$points" },
          topScore: { $max: "$points" }
        }
      },
      {
        // Sort by average points descending
        $sort: { avgPoints: -1 }
      },
      {
        // Add rank using window functions
        $setWindowFields: {
          sortBy: { avgPoints: -1 },
          output: {
            rank: { $rank: {} }
          }
        }
      },
      {
        // Project final format
        $project: {
          _id: 0,
          zipCode: "$_id",
          totalPoints: 1,
          userCount: 1,
          avgPoints: { $round: ["$avgPoints", 1] },
          topScore: 1,
          rank: 1
        }
      },
      {
        // Limit for performance
        $limit: 50
      }
    ]).toArray()

    // Add coordinates from our mapping
    const enrichedData = mapData.map(entry => {
      const coords = ZIP_TO_COORDS[entry.zipCode] || {
        // Default coordinates if ZIP not in mapping
        lat: 39.8283 + (Math.random() - 0.5) * 20,
        lng: -98.5795 + (Math.random() - 0.5) * 40,
        city: `ZIP ${entry.zipCode}`,
        state: 'US'
      }

      return {
        ...entry,
        latitude: coords.lat,
        longitude: coords.lng,
        city: coords.city,
        state: coords.state
      }
    })

    console.log(`✅ Map data ready: ${enrichedData.length} ZIP codes`)

    return NextResponse.json({
      success: true,
      communities: enrichedData,
      totalCommunities: enrichedData.length
    })

  } catch (error) {
    console.error('❌ Error fetching map data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch map data' },
      { status: 500 }
    )
  }
}