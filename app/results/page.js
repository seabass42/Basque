"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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

  useEffect(() => {
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

            // Lookup location info
            if (userAnswers.zipCode) {
              try {
                const zipResponse = await fetch(`/api/zipcode-lookup?zip=${userAnswers.zipCode}`)
                const zipData = await zipResponse.json()
                if (zipData.success) {
                  setLocationInfo(zipData)
                  console.log('Location:', zipData.displayName)
                }
              } catch (error) {
                console.error('Error fetching location:', error)
              }

              // Fetch leaderboard with user's ZIP
              try {
                const leaderboardResponse = await fetch(`/api/leaderboard?zipCode=${userAnswers.zipCode}`)
                const leaderboardData = await leaderboardResponse.json()
                if (leaderboardData.success) {
                  setLeaderboard(leaderboardData.leaderboard.slice(0, 10)) // Top 10
                  setUserRank(leaderboardData.userRank)
                  console.log('Leaderboard loaded')
                }
              } catch (error) {
                console.error('Error fetching leaderboard:', error)
              }
            }

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
          
          if (parsed.zipCode) {
            try {
              const zipResponse = await fetch(`/api/zipcode-lookup?zip=${parsed.zipCode}`)
              const zipData = await zipResponse.json()
              if (zipData.success) {
                setLocationInfo(zipData)
              }
            } catch {}

            try {
              const leaderboardResponse = await fetch(`/api/leaderboard?zipCode=${parsed.zipCode}`)
              const leaderboardData = await leaderboardResponse.json()
              if (leaderboardData.success) {
                setLeaderboard(leaderboardData.leaderboard.slice(0, 10))
                setUserRank(leaderboardData.userRank)
              }
            } catch {}
          }
          
          fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          })
          .then(r => r.json())
          .then(data => {
            if (data.success) setRecs({ articles: data.articles, mealPlans: data.mealPlans, improvements: data.improvements })
          })
          .catch(() => {})
        } catch {}
      }
      
      setLoading(false)
    }

    fetchData()
  }, [])

  const score = useMemo(() => answers ? computeScore(answers) : 0, [answers])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!answers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="bg-green-700 py-4 px-6 shadow-md">
        <h2 className="text-white text-lg font-semibold">
          Basque - Your Personalized Results
        </h2>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* User Rank Card - NEW! */}
        {userRank && (
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Your Community Ranking</h3>
                <p className="text-green-100">
                  ZIP Code {userRank.zipCode}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold mb-1">
                  #{userRank.rank}
                </div>
                <p className="text-green-100">
                  {userRank.avgPoints} avg points
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-400 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{userRank.userCount}</div>
                <div className="text-sm text-green-100">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{userRank.totalPoints}</div>
                <div className="text-sm text-green-100">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{userRank.topScore}</div>
                <div className="text-sm text-green-100">Top User</div>
              </div>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Summary Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-green-700 mb-4">Your Preference Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              
              <div className="md:col-span-2 flex items-center gap-3">
                <span className="font-semibold">Location:</span>
                {locationInfo ? (
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1 rounded-full text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: locationInfo.state.color }}
                    >
                      {locationInfo.state.abbreviation}
                    </span>
                    <span className="text-lg font-medium text-green-700">
                      {locationInfo.displayName}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({locationInfo.state.name})
                    </span>
                  </div>
                ) : (
                  <span>{answers.zipCode || '-'}</span>
                )}
              </div>

              <div><span className="font-semibold">Transport:</span> {answers.transportation || '-'}</div>
              <div><span className="font-semibold">Diet:</span> {answers.diet || '-'}</div>
              <div><span className="font-semibold">Home Energy:</span> {answers.homeEnergy || '-'}</div>
              <div><span className="font-semibold">Thermostat:</span> {answers.thermostat || '-'}</div>
              <div><span className="font-semibold">Recycling:</span> {answers.recycling || '-'}</div>
              <div><span className="font-semibold">Water Use:</span> {answers.waterUsage || '-'}</div>
              <div><span className="font-semibold">Flights/Year:</span> {answers.flightsPerYear || '-'}</div>
              <div><span className="font-semibold">Home Size:</span> {answers.homeSize || '-'}</div>
              <div><span className="font-semibold">WFH Days/Week:</span> {answers.wfhDays || '-'}</div>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center">
            <div className="text-sm text-gray-600 mb-2">Your Basque Score</div>
            <div className="text-6xl font-extrabold text-green-700">{score}</div>
            <div className="mt-3 text-gray-700 text-center">
              {score >= 80 ? 'Great job - you are already very climate-conscious!' :
               score >= 60 ? 'Solid foundation - a few tweaks can make a big impact.' :
               score >= 40 ? 'Lots of opportunity - try a few actions below to level up.' :
               'A fresh start - the suggestions below will help you begin strong.'}
            </div>
          </div>

          {/* Top Communities Leaderboard - NEW! */}
          {leaderboard.length > 0 && (
            <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-green-700 mb-4">Top Communities</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ZIP Code</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Avg Points</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Users</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Points</th>
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
                          <td className="px-4 py-3 text-right text-gray-600">
                            {entry.userCount}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
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

          {/* Articles */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-green-700 mb-4">Suggested Articles</h3>
            <ul className="space-y-3">
              {recs.articles.map((a, i) => (
                <li key={i}>
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
                    • {a.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Meal Plans */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-green-700 mb-4">Meal Ideas</h3>
            {recs.mealPlans.map((mp, i) => (
              <div key={i} className="mb-4">
                <div className="font-semibold text-gray-800 mb-2">{mp.title}</div>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {mp.items?.map((it, j) => (
                    <li key={j}><a href={it.link} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">{it.name}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Improvements */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-green-700 mb-4">Lifestyle Improvements</h3>
            <ul className="space-y-3">
              {recs.improvements.map((imp, i) => (
                <li key={i}>
                  <div className="font-semibold text-gray-800">{imp.title}</div>
                  {imp.description && <div className="text-gray-700 text-sm">{imp.description}</div>}
                  {imp.link && <a href={imp.link} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline text-sm">Learn more</a>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">
        <Link href="/quiz">
          <button className="px-6 py-3 border-2 border-green-600 text-green-700 rounded-2xl hover:bg-green-50 transition">Retake Quiz</button>
        </Link>
      </div>
    </div>
  )
}