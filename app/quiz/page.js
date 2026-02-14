"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Quiz() {
  const [zip, setZip] = useState("")
  const router = useRouter()

  function handleSubmit(e) {
    e.preventDefault()

    if (!zip) return

    console.log("ZIP submitted:", zip)

    router.push("/results")
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-white">

      {/* Top Bar */}
      <div className="bg-green-700 py-4 px-6 shadow-md">
        <h2 className="text-white text-lg font-semibold tracking-wide">
          Basque — Climate Action Quiz
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-20">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">

          <h1 className="text-3xl font-bold text-green-700 mb-4">
            Let’s personalize your climate impact
          </h1>

          <p className="text-gray-600 mb-8">
            First, tell us your ZIP code so we can tailor recommendations to your area.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>

              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="e.g. 94107"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition duration-200 shadow-md"
            >
              Get My Recommendations
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}