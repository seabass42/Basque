"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
// Threads background moved to global layout
import Grainient from '../../components/Grainient';

export default function Dashboard() {
  const [userStats, setUserStats] = useState(null)
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zipCode, setZipCode] = useState(null)
  const [locationInfo, setLocationInfo] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const userId = localStorage.getItem('basque_user_id')
    
    if (!userId) {
      window.location.href = '/quiz'
      return
    }

    try {
      // Fetch user stats
      const statsResponse = await fetch(`/api/user-stats?userId=${userId}`)
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setUserStats(statsData.stats)
        setZipCode(statsData.stats.zipCode)
        try {
              const zipResponse = await fetch(`/api/zipcode-lookup?zip=${statsData.stats.zipCode}`)
              const zipData = await zipResponse.json()
              if (zipData.success) {
                setLocationInfo(zipData)
              }
            } catch (error) {
              console.error('Error fetching location:', error)
            }

        // Fetch leaderboard rank
        if (statsData.stats.zipCode) {
          const leaderboardResponse = await fetch(`/api/leaderboard?zipCode=${statsData.stats.zipCode}`)
          const leaderboardData = await leaderboardResponse.json()
          if (leaderboardData.success) {
            setUserRank(leaderboardData.userRank)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center card">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 card">
        <div className="rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center bg-card-background card">
          <h1 className="text-3xl font-bold text-default-foreground mb-4">No Data Yet</h1>
          <p className="text-default-foreground mb-6">Take the quiz to see your dashboard.</p>
          <Link href="/quiz">
            <button className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-700 transition">
              Take Quiz
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-transparent text-default-foreground">
       

       <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
        {/* Back Button */}
        <div>
          <Link href="/results">
            <button className="flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold">
              ← Back to Results
            </button>
          </Link>
        </div>

        {/* Community Rank Card */}
        {userRank && (
          <div className="relative rounded-3xl shadow-xl p-6 bg-transparent relative overflow-hidden card">
            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
              <Grainient
                color1="#46a058"
                color2="#00570e"
                color3="#199428"
                timeSpeed={1}
                colorBalance={0}
                warpStrength={1}
                warpFrequency={5}
                warpSpeed={2}
                warpAmplitude={50}
                blendAngle={0}
                blendSoftness={0.05}
                rotationAmount={500}
                noiseScale={2}
                grainAmount={0.1}
                grainScale={2}
                grainAnimated={false}
                contrast={1.5}
                gamma={1}
                saturation={1}
                centerX={0}
                centerY={0}
                zoom={0.9}
              />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-green-100">Your Community Ranking</h3>
                  {locationInfo ? (
                  <p className="text-green-100 flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-full text-green-100 font-bold text-xs"
                      style={{ backgroundColor: locationInfo.state.color }}
                    >
                      {locationInfo.state.abbreviation}
                    </span>
                    {locationInfo.displayName} ({userRank.zipCode})
                  </p>
                ) : (
                  <p className="text-green-100">ZIP Code {userRank.zipCode}</p>
                )}
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-green-100 mb-1">#{userRank.rank}</div>
                  <p className="text-green-100">avg points</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-400 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-100">{userRank.userCount}</div>
                  <div className="text-sm text-green-100">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-100">{userRank.totalPoints}</div>
                  <div className="text-sm text-green-100">Total Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-100">{userRank.topScore}</div>
                  <div className="text-sm text-green-100">Top User</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-100">{userStats.totalPoints}</div>
                  <div className="text-sm text-green-100">🏆 Your Points</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact by Category - Full Width */}
        <div className="rounded-3xl shadow-xl p-8 bg-card-background">
          <h3 className="text-2xl font-bold text-default-foreground mb-6">Your Impact by Category</h3>
          {userStats.statsByCategory.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6">
              {userStats.statsByCategory.map((cat) => (
                <div key={cat.category} className="text-center p-6 rounded-2xl bg-card-background card">
                  <div className="text-3xl mb-2">
                    {cat.category === 'transportation' ? '🚗' :
                     cat.category === 'diet' ? '🥗' :
                     cat.category === 'energy' ? '⚡' :
                     cat.category === 'water' ? '💧' :
                     cat.category === 'shopping' ? '🛍️' : '🌱'}
                  </div>
                  <div className="font-semibold text-default-foreground capitalize text-lg mb-1">
                    {cat.category}
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {cat.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cat.count} action{cat.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-default-foreground text-lg mb-4">Complete actions to see your impact!</p>
              <Link href="/results">
                <button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
                  Go to Actions
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Community Comparison & Recent Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Community Comparison */}
          <div className="rounded-3xl shadow-xl p-8 bg-card-background">
            <h3 className="text-2xl font-bold text-default-foreground mb-6">vs. Your Community</h3>
            <div className="space-y-6">
              
              <div className="p-6 rounded-2xl bg-card-background card">
                <div className="text-sm text-default-foreground mb-2">Your Points</div>
                <div className="text-5xl font-bold text-green-600 mb-3">
                  {userStats.totalPoints}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-default-foreground">
                    Community Avg: {Math.round(userStats.communityComparison.avgPoints)}
                  </div>
                  {userStats.totalPoints > userStats.communityComparison.avgPoints ? (
                    <div className="text-green-600 font-bold">
                      ↑ {Math.round(((userStats.totalPoints / userStats.communityComparison.avgPoints) - 1) * 100)}%
                    </div>
                  ) : userStats.totalPoints === 0 ? (
                    <div className="text-gray-500 text-sm">Start now!</div>
                  ) : (
                    <div className="text-gray-500 text-sm">Keep going!</div>
                  )}
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-card-background card">
                <div className="text-sm text-default-foreground mb-2">Actions Completed</div>
                <div className="text-5xl font-bold text-blue-600 mb-3">
                  {userStats.totalActions}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-default-foreground">
                    Community Avg: {Math.round(userStats.communityComparison.avgActions)}
                  </div>
                  {userStats.totalActions > userStats.communityComparison.avgActions && (
                    <div className="text-blue-600 font-bold">
                      ↑ Above avg!
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl bg-card-background card">
                <div>
                  <div className="text-sm text-default-foreground">Community Size</div>
                  <div className="text-2xl font-bold text-default-foreground">
                    {userStats.communityComparison.totalUsers} users
                  </div>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>
          </div>

          {/* Recent Actions */}
          <div className="rounded-3xl shadow-xl p-8 bg-card-background card">
            <h3 className="text-2xl font-bold text-default-foreground mb-6">Recent Actions</h3>
            {userStats.actionHistory.length > 0 ? (
              <div className="space-y-4">
                {userStats.actionHistory.slice(0, 6).map((action, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-green-50 transition bg-card-background card">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                      {action.category === 'transportation' ? '🚗' :
                       action.category === 'diet' ? '🥗' :
                       action.category === 'energy' ? '⚡' :
                       action.category === 'water' ? '💧' :
                       action.category === 'shopping' ? '🛍️' : '🌱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-default-foreground mb-1">
                        {action.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 capitalize">
                          {action.category}
                        </span>
                        <span className="text-green-600 font-bold">
                          +{action.pointValue} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-default-foreground text-lg mb-2">No actions completed yet</p>
                <Link href="/results">
                  <button className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition">
                    Start Earning Points
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="rounded-3xl shadow-xl p-8 text-white text-center bg-card-background card">
          <h3 className="text-2xl font-bold mb-4">Ready to Take More Action?</h3>
          <p className="text-default-background-100 mb-6">
            Complete personalized climate actions to boost your score and help your community climb the leaderboard!
          </p>
          <Link href="/results">
            <button className="px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition font-semibold text-lg shadow-lg">
              View Available Actions
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}