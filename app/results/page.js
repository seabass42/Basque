"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Grainient from '../../components/Grainient';

function computeScore(answers) {
  let score = 100
  const t = answers.transportation
  if (t === 'Drive alone') score -= 30
  else if (t === 'Carpool') score -= 15
  else if (t === 'Public transit') score -= 5
  const d = answers.diet
  if (d === 'Meat with most meals') score -= 25
  else if (d === 'Meat sometimes') score -= 10
  else if (d === 'Vegetarian') score -= 5
  const he = answers.homeEnergy || ''
  if (he.includes('gas')) score -= 15
  const th = answers.thermostat
  if (th === '72°F+ year-round') score -= 10
  else if (th?.includes('70')) score -= 6
  else if (th?.includes('68') || th?.includes('75')) score -= 3
  const rec = answers.recycling
  if (rec?.toLowerCase().includes('rarely')) score -= 8
  else if (rec?.toLowerCase().includes('some')) score -= 4
  const water = answers.waterUsage
  if (water === 'High') score -= 6
  else if (water === 'Moderate') score -= 3
  const flights = answers.flightsPerYear
  if (flights === '6+') score -= 20
  else if (flights === '3-5') score -= 12
  else if (flights === '1-2') score -= 6
  const size = answers.homeSize
  if (size?.includes('Large')) score -= 6
  else if (size?.includes('Medium')) score -= 3
  const wfh = answers.wfhDays
  if (wfh === '0') score -= 5
  else if (wfh === '1-2') score -= 3
  return Math.max(0, Math.min(100, Math.round(score)))
}

export default function Results() {
  const [answers, setAnswers] = useState(null)
  const [recs, setRecs] = useState({ articles: [], mealPlans: [], improvements: [] })
  const [loading, setLoading] = useState(true)
  const [locationInfo, setLocationInfo] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [tasks, setTasks] = useState([])
  const [userPoints, setUserPoints] = useState(0)
  const [completingTask, setCompletingTask] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const userId = localStorage.getItem('basque_user_id')
    
    if (userId) {
      try {
        console.log('Fetching user data from MongoDB...')
        
        const userResponse = await fetch(`/api/user?userId=${userId}`)
        const userData = await userResponse.json()

        if (userResponse.ok && userData.success) {
          console.log('Got data from MongoDB')
          const userAnswers = userData.user
          setAnswers(userAnswers)
          setUserPoints(userAnswers.points || 0)

          // Lookup location
          if (userAnswers.zipCode) {
            try {
              const zipResponse = await fetch(`/api/zipcode-lookup?zip=${userAnswers.zipCode}`)
              const zipData = await zipResponse.json()
              if (zipData.success) {
                setLocationInfo(zipData)
              }
            } catch (error) {
              console.error('Error fetching location:', error)
            }

            // Fetch leaderboard
            try {
              const leaderboardResponse = await fetch(`/api/leaderboard?zipCode=${userAnswers.zipCode}`)
              const leaderboardData = await leaderboardResponse.json()
              if (leaderboardData.success) {
                setLeaderboard(leaderboardData.leaderboard.slice(0, 10))
                setUserRank(leaderboardData.userRank)
              }
            } catch (error) {
              console.error('Error fetching leaderboard:', error)
            }
          }

          // Fetch personalized tasks
          try {
            const tasksResponse = await fetch(`/api/tasks?userId=${userId}`)
            const tasksData = await tasksResponse.json()
            if (tasksData.success) {
              setTasks(tasksData.tasks)
              console.log('Tasks loaded:', tasksData.tasks.length)
            }
          } catch (error) {
            console.error('Error fetching tasks:', error)
          }

          // Fetch recommendations
          const recResponse = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userAnswers)
          })
          
          const recData = await recResponse.json()
          if (recData.success) {
            setRecs({ 
              articles: recData.articles, 
              mealPlans: recData.mealPlans, 
              improvements: recData.improvements 
            })
          }
          
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Error fetching from MongoDB:', error)
      }
    }

    console.log('Falling back to localStorage')
    const stored = localStorage.getItem('basque_answers')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAnswers(parsed)
      } catch {}
    }
    
    setLoading(false)
  }

  async function handleCompleteTask(taskId, pointValue) {
    const userId = localStorage.getItem('basque_user_id')
    setCompletingTask(taskId)

    try {
      const response = await fetch('/api/complete-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actionId: taskId })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        setUserPoints(data.newPoints)

        if (answers?.zipCode) {
          const leaderboardResponse = await fetch(`/api/leaderboard?zipCode=${answers.zipCode}`)
          const leaderboardData = await leaderboardResponse.json()
          if (leaderboardData.success) {
            setLeaderboard(leaderboardData.leaderboard.slice(0, 10))
            setUserRank(leaderboardData.userRank)
          }
        }

        console.log('Task completed! New points:', data.newPoints)
      } else {
        alert('Failed to complete task: ' + data.error)
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task')
    } finally {
      setCompletingTask(null)
    }
  }

  const score = useMemo(() => answers ? computeScore(answers) : 0, [answers])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center card">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!answers) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 card">
        <div className="rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center card">
          <h1 className="text-3xl font-bold text-green-700 mb-4">No Results Yet</h1>
          <p className="text-gray-700 mb-6">Please take the quiz to generate personalized recommendations.</p>
          <Link href="/quiz">
            <button className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-700 transition">Go to Quiz</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-default-foreground">
      

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        
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
                  <h3 className="text-2xl font-bold mb-2 text-white">Your Community Ranking</h3>
                  {locationInfo ? (
                  <p className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-full text-white font-bold text-xs"
                      style={{ backgroundColor: locationInfo.state.color }}
                    >
                      {locationInfo.state.abbreviation}
                    </span>
                    {locationInfo.displayName} ({userRank.zipCode})
                  </p>
                ) : (
                  <p>ZIP Code {userRank.zipCode}</p>
                )}
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold mb-1">#{userRank.rank}</div>
                  <p className="text-white">avg points</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-400 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{userRank.userCount}</div>
                  <div className="text-sm text-white">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{userRank.totalPoints}</div>
                  <div className="text-sm text-white">Total Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{userRank.topScore}</div>
                  <div className="text-sm text-white">Top User</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{userPoints.totalPoints}</div>
                  <div className="text-sm text-white">🏆 Your Points</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Carbon Offset Progress Bar - NEW! */}
<div className="rounded-3xl shadow-xl p-8 card">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-2xl font-bold text-default-foreground">Your Carbon Impact</h3>
      <p className="text-default-foreground text-sm mt-1">
        You've offset approximately <span className="font-bold text-default-foreground">{Math.round(userPoints * 0.5)} kg</span> of CO₂ this year
      </p>
    </div>
    <div className="text-5xl">🌍</div>
  </div>

  {/* Progress Bar */}
  <div className="relative">
    <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
        style={{ 
          width: `${Math.min((userPoints / 1000) * 100, 100)}%`
        }}
      >
        {userPoints > 0 && (
          <span className="text-white font-bold text-sm">
            {Math.round((userPoints / 1000) * 100)}%
          </span>
        )}
      </div>
    </div>

    <div className="flex justify-between mt-2 text-xs text-gray-500">
      <span>0 kg</span>
      <span className="text-gray-400">250 kg</span>
      <span className="font-semibold text-green-600">500 kg (Goal)</span>
    </div>
  </div>

  {/* Impact equivalents */}
  <div className="grid grid-cols-3 gap-4 mt-6">
    <div className="text-center p-4 bg-card-background rounded-xl">
      <div className="text-2xl mb-1">🚗</div>
      <div className="text-2xl font-bold text-default-foreground">
        {Math.round(userPoints * 0.5 / 0.4)}
      </div>
      <div className="text-xs text-default-foreground">miles not driven</div>
    </div>
    
    <div className="text-center p-4 bg-card-background rounded-xl">
      <div className="text-2xl mb-1">🌲</div>
      <div className="text-2xl font-bold text-default-foreground">
        {Math.round(userPoints * 0.5 / 21)}
      </div>
      <div className="text-xs text-default-foreground">trees planted equivalent</div>
    </div>
    
    <div className="text-center p-4 bg-card-background rounded-xl">
      <div className="text-2xl mb-1">💡</div>
      <div className="text-2xl font-bold text-default-foreground">
        {Math.round(userPoints * 0.5 / 0.5)}
      </div>
      <div className="text-xs text-default-foreground">light bulbs switched</div>
    </div>
  </div>

  {/* Next milestone */}
  {userPoints < 1000 && (
    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎯</div>
        <div className="flex-1">
          <div className="font-semibold text-default-foreground">
            Next Milestone: {Math.round((1000 - userPoints) / 100) * 100} points away
          </div>
          <div className="text-sm text-default-foreground">
            Complete {Math.ceil((1000 - userPoints) / 100)} more actions to reach 500kg offset!
          </div>
        </div>
      </div>
    </div>
  )}

  {userPoints >= 1000 && (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎉</div>
        <div className="flex-1">
          <div className="font-bold text-default-foreground text-lg">
            Goal Achieved! You're a Climate Champion!
          </div>
          <div className="text-sm text-default-foreground">
            You've offset 500kg of CO₂ - that's incredible!
          </div>
        </div>
      </div>
    </div>
  )}
</div>

        {/* Actionable Tasks Section */}
        {tasks.length > 0 && (
          <div className="rounded-3xl shadow-xl p-8 bg-card-background card">
            <h3 className="text-2xl font-bold text-default-foreground mb-4">Take Action - Earn Points!</h3>
            <p className="text-default-foreground mb-6">Complete these personalized climate actions to earn points and climb the leaderboard</p>
            <div className="grid md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 transition card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      {task.category}
                    </span>
                    <span className="text-green-600 font-bold text-lg">
                      +{task.pointValue} pts
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-default-foreground mb-2">
                    {task.title}
                  </h4>

                  <p className="text-default-foreground text-sm mb-3">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      💚 {task.impactMetric}
                    </span>

                    <button
                      onClick={() => handleCompleteTask(task.id, task.pointValue)}
                      disabled={completingTask === task.id}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        completingTask === task.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {completingTask === task.id ? 'Completing...' : 'I Did This!'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Communities Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-3xl shadow-xl p-8 bg-card-background card">
            <h3 className="text-2xl font-bold text-default-foreground mb-4">Top Communities Leaderboard</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-default-foreground">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-default-foreground">ZIP Code</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-default-foreground">Avg Points</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-default-foreground">Users</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-default-foreground">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.map((entry) => {
                    const isUserZip = userRank && entry.zipCode === userRank.zipCode
                    const isMedal = entry.rank <= 3

                    return (
                      <tr
                        key={entry.zipCode}
                        className={`transition hover:bg-green-50 ${
                          isUserZip ? 'bg-green-100 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isMedal && (
                              <span className="text-xl">
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            )}
                            <span className={isMedal ? 'text-lg font-bold' : ''}>
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">
                            {entry.zipCode}
                            {isUserZip && (
                              <span className="ml-2 text-green-600">← You</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-600 font-semibold">
                            {entry.avgPoints}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-default-foreground">
                          {entry.userCount}
                        </td>
                        <td className="px-4 py-3 text-right text-default-foreground">
                          {entry.totalPoints}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 flex gap-4">
        <Link href="/quiz">
          <button className="px-6 py-3 border-2 border-green-600 text-green-700 rounded-2xl hover:bg-green-50 transition">
            Retake Quiz
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition">
            View Full Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}