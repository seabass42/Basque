"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CommunityMap from '../../components/CommunityMap'

export default function MapPage() {
  const [userZipCode, setUserZipCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user's ZIP code from localStorage
    const userId = localStorage.getItem('basque_user_id')
    
    if (userId) {
      fetchUserZip(userId)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchUserZip(userId) {
    try {
      const response = await fetch(`/api/user?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.user.zipCode) {
        setUserZipCode(data.user.zipCode)
      }
    } catch (error) {
      console.error('Error fetching user ZIP:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 border-2 border-green-600 rounded-xl">
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            Climate Action Across America
          </h1>
          <p className="text-xl text-green-600 max-w-3xl mx-auto">
            See how communities nationwide are competing to reduce their carbon footprint. 
            Larger markers = higher average points. Click any marker to explore!
          </p>
        </div>

        {/* Map Component */}
        <CommunityMap userZipCode={userZipCode} />

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl shadow-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Help Your Community Climb the Rankings!
          </h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Complete more climate actions to boost your community's score and move up on the map.
          </p>
          <Link href="/results">
            <button className="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition font-semibold text-lg shadow-lg">
              View Your Actions
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}