import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
    try{
        const quizAnswers = await request.json()

        console.log('Quiz answers received:', quizAnswers)

        if (!quizAnswers.zipCode){
            return NextResponse.json(
                {success: false, error: 'ZIP code is required'},
                {status: 400 }
            )
        }

        const client = await clientPromise
        const db = client.db('basque')

        console.log('Connected to MongoDB')

        const userDocument = {
            ...quizAnswers,
            createdAt: new Date(),
            updatedAt: new Date(),
            points: 0,
            completedActions: [],
        }
        console.log('Saving user document:', userDocument)

        const result = await db.collection('users').insertOne(userDocument)

        console.log('User created with ID:', result.insertedId)

        return NextResponse.json({
            success: true,
            userId: result.insertedId.toString(),
            messsage: 'Quiz submitted successfully!'
        })
    } catch (error) {
        console.error('Error in quiz-submit:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to submit quiz. Please try again.'
            },
            { status: 500 }
        )
    }
}