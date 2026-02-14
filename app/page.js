"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Welcome() {
  const router = useRouter()
  const [hasUserID, setHasUserID] = useState(false)
/* Implement when done testing.
  useEffect(() => {
    const existingUserID = localStorage.getItem('basque_user_id')
    setHasUserID(!!existingUserID)
  }, [])

  if (hasUserID) router.push('/results')
*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-green-700 mb-6">
          Welcome to Basque
        </h1>

        <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
          Discover personalized ways to reduce your carbon footprint, 
          support trusted climate initiatives, and take meaningful action — 
          starting today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/quiz">
            <button className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-700 transition duration-200">
                Get Started
            </button>
          </Link>
        
          <Link href="/learn-more">
            <button className="px-6 py-3 border-2 border-green-600 text-green-700 rounded-2xl hover:bg-green-50 transition duration-200">
            Learn More
          </button>
          </Link>
        </div>

      </div>
    </div>
  )
}