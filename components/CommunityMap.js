"use client"

import { useEffect, useState } from 'react'

// Simplified US state coordinates for basic map
const usStates = [
  { id: "CA", name: "California", x: 50, y: 180 },
  { id: "NY", name: "New York", x: 650, y: 120 },
  { id: "TX", name: "Texas", x: 350, y: 300 },
  { id: "FL", name: "Florida", x: 600, y: 350 },
  { id: "IL", name: "Illinois", x: 450, y: 150 },
  { id: "PA", name: "Pennsylvania", x: 620, y: 130 },
  { id: "OH", name: "Ohio", x: 570, y: 140 },
  { id: "GA", name: "Georgia", x: 580, y: 280 },
  { id: "NC", name: "North Carolina", x: 620, y: 240 },
  { id: "MI", name: "Michigan", x: 520, y: 110 },
  { id: "WA", name: "Washington", x: 80, y: 50 },
  { id: "MA", name: "Massachusetts", x: 680, y: 110 },
  { id: "AZ", name: "Arizona", x: 150, y: 260 },
  { id: "CO", name: "Colorado", x: 250, y: 180 }
]

// Convert lat/long to SVG coordinates (simplified projection)
function projectCoordinates(longitude, latitude) {
  // Simple mercator-ish projection
  const mapWidth = 800
  const mapHeight = 400
  
  const x = ((longitude + 125) / 58) * mapWidth
  const y = ((50 - latitude) / 25) * mapHeight
  
  return { x, y }
}

export default function CommunityMap({ userZipCode }) {
  const [communities, setCommunities] = useState([])
  const [selectedCommunity, setSelectedCommunity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMapData()
  }, [])

  async function fetchMapData() {
    try {
      const response = await fetch('/api/map-data')
      const data = await response.json()
      
      if (data.success) {
        setCommunities(data.communities)
        console.log('Map data loaded:', data.communities.length, 'communities')
      }
    } catch (error) {
      console.error('Error fetching map data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getMarkerColor(rank) {
    if (rank === 1) return "#FFD700" // Gold
    if (rank === 2) return "#C0C0C0" // Silver
    if (rank === 3) return "#CD7F32" // Bronze
    return "#10b981" // Green
  }

  function getMarkerSize(avgPoints) {
    const minSize = 8
    const maxSize = 24
    const normalized = Math.min(avgPoints / 500, 1)
    return minSize + (normalized * (maxSize - minSize))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 relative">
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
          Community Impact Map
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          {communities.length} communities taking climate action across the US
        </p>

        {/* Legend */}
        <div className="absolute top-6 right-6 bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg z-10">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Rankings</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFD700" }}></div>
              <span className="text-gray-600 dark:text-gray-300">1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#C0C0C0" }}></div>
              <span className="text-gray-600 dark:text-gray-300">2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#CD7F32" }}></div>
              <span className="text-gray-600 dark:text-gray-300">3rd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-300">Active</span>
            </div>
          </div>
        </div>

        {/* SVG Map */}
        <div className="w-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          <svg viewBox="0 0 800 400" className="w-full h-auto">
            {/* Background */}
            <rect width="800" height="400" fill="transparent" />
            
            {/* State labels (simplified) */}
            {usStates.map((state) => (
              <text
                key={state.id}
                x={state.x}
                y={state.y}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
                className="select-none"
              >
                {state.id}
              </text>
            ))}

            {/* Community markers */}
            {communities.map((community) => {
              const { x, y } = projectCoordinates(community.longitude, community.latitude)
              const isUserCommunity = community.zipCode === userZipCode
              const markerSize = getMarkerSize(community.avgPoints)
              const markerColor = getMarkerColor(community.rank)

              return (
                <g
                  key={community.zipCode}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedCommunity(community)}
                >
                  {/* Pulse effect for user's community */}
                  {isUserCommunity && (
                    <circle
                      cx={x}
                      cy={y}
                      r={markerSize + 6}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="r"
                        from={markerSize + 6}
                        to={markerSize + 12}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.5"
                        to="0"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Main marker */}
                  <circle
                    cx={x}
                    cy={y}
                    r={markerSize}
                    fill={markerColor}
                    stroke={isUserCommunity ? "#10b981" : "white"}
                    strokeWidth={isUserCommunity ? "3" : "2"}
                    opacity="0.9"
                    className="transition-opacity hover:opacity-100"
                  />

                  {/* Rank label for top 3 */}
                  {community.rank <= 3 && (
                    <text
                      x={x}
                      y={y - markerSize - 6}
                      fontSize="12"
                      fontWeight="bold"
                      fill={markerColor}
                      stroke="white"
                      strokeWidth="3"
                      paintOrder="stroke"
                      textAnchor="middle"
                    >
                      #{community.rank}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Selected Community Details */}
      {selectedCommunity && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl shadow-xl p-6 text-white animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-2xl font-bold">
                  {selectedCommunity.city}, {selectedCommunity.state}
                </h4>
                {selectedCommunity.zipCode === userZipCode && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    Your Community
                  </span>
                )}
              </div>
              <p className="text-green-100">ZIP Code {selectedCommunity.zipCode}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">#{selectedCommunity.rank}</div>
              <p className="text-green-100">National Rank</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-green-400">
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedCommunity.userCount}</div>
              <div className="text-sm text-green-100">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedCommunity.avgPoints}</div>
              <div className="text-sm text-green-100">Avg Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedCommunity.totalPoints}</div>
              <div className="text-sm text-green-100">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{selectedCommunity.topScore}</div>
              <div className="text-sm text-green-100">Top User</div>
            </div>
          </div>

          <button
            onClick={() => setSelectedCommunity(null)}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {communities.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Active Communities
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {communities.reduce((sum, c) => sum + c.userCount, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Total Users
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(communities.reduce((sum, c) => sum + c.totalPoints, 0) * 0.5)}kg
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            CO₂ Offset
          </div>
        </div>
      </div>
    </div>
  )
}