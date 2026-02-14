import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// POST /api/complete-action
export async function POST(request) {
  try {
    const { userId, actionId } = await request.json()

    if (!userId || !actionId) {
      return NextResponse.json(
        { success: false, error: 'userId and actionId are required' },
        { status: 400 }
      )
    }

    console.log(`✅ User ${userId} completing action ${actionId}`)

    const client = await clientPromise
    const db = client.db('basque')

    // STEP 1: Get the recommendation to find its point value
    const recommendation = await db.collection('recommendations').findOne({
      _id: new ObjectId(actionId)
    })

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    console.log(`📋 Action: "${recommendation.title}" worth ${recommendation.pointValue} points`)

    // STEP 2: Update the user document
    // Add actionId to completedActions array AND increment points
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { completedActions: new ObjectId(actionId) },  // Add to array
        $inc: { points: recommendation.pointValue },           // Increment points
        $set: { updatedAt: new Date() }                       // Update timestamp
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // STEP 3: Get updated user to return new points total
    const updatedUser = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    console.log(`🎉 User now has ${updatedUser.points} points (${updatedUser.completedActions.length} actions completed)`)

    return NextResponse.json({
      success: true,
      newPoints: updatedUser.points,
      completedCount: updatedUser.completedActions.length,
      message: `Great! You earned ${recommendation.pointValue} points!`
    })

  } catch (error) {
    console.error('❌ Error completing action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete action' },
      { status: 500 }
    )
  }
}

/*
WHAT THIS API DOES:

1. Receives: { userId: "abc123", actionId: "xyz789" }

2. Looks up the action in recommendations collection
   to get its point value

3. Updates user document with TWO operations:
   - $push: Adds actionId to completedActions array
   - $inc: Increments points by the action's point value

4. Returns the user's new point total

MONGODB OPERATIONS SHOWCASED:

✅ $push - Add to array
✅ $inc - Atomic increment
✅ $set - Update field
✅ Multiple operations in single update
✅ Cross-collection queries

EXAMPLE FLOW:

Before:
{
  _id: ObjectId("user123"),
  points: 100,
  completedActions: [ObjectId("action1")]
}

User completes action worth 50 points:
POST /api/complete-action
{ userId: "user123", actionId: "action2" }

After:
{
  _id: ObjectId("user123"),
  points: 150,  ← Incremented!
  completedActions: [
    ObjectId("action1"),
    ObjectId("action2")  ← Added!
  ],
  updatedAt: Date  ← Updated!
}
*/