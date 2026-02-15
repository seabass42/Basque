"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Quiz() {
  const router = useRouter()
  
  // STEP 1: Track which question we're on (starts at 0)
  const [currentStep, setCurrentStep] = useState(0)
  
  // STEP 2: Store all the user's answers
  const [answers, setAnswers] = useState({
    zipCode: "",
    transportation: "",
    diet: "",
    homeEnergy: "",
    thermostat: "",
    recycling: "",
    waterUsage: "",
    flightsPerYear: "",
    homeSize: "",
    wfhDays: ""
  })

  // STEP 3: Define your questions (max 10)
  // This is just an array of objects - each object is one question
  const questions = [
    {
      id: "zipCode",
      text: "What's your ZIP code?",
      type: "text",
      placeholder: "e.g. 94107"
    },
    {
      id: "transportation",
      text: "How do you usually get around?",
      type: "choice",
      options: [
        "Drive alone",
        "Carpool",
        "Public transit",
        "Bike/Walk"
      ]
    },
    {
      id: "diet",
      text: "What best describes your diet?",
      type: "choice",
      options: [
        "Meat with most meals",
        "Meat sometimes",
        "Vegetarian",
        "Mostly plant-based"
      ]
    },
    {
      id: "homeEnergy",
      text: "What powers your home heating/cooking?",
      type: "choice",
      options: [
        "Mostly natural gas",
        "Mix of gas and electric",
        "All electric",
        "Electric with renewable plan"
      ]
    },
    {
      id: "thermostat",
      text: "How do you typically set your thermostat?",
      type: "choice",
      options: [
        "72°F+ year-round",
        "Cool ~70°F / Heat ~70°F",
        "Seasonal: 68°F heat / 75°F cool",
        "Efficient: 66°F heat / 78°F+ cool"
      ]
    },
    {
      id: "recycling",
      text: "Recycling/composting habits",
      type: "choice",
      options: [
        "Rarely recycle",
        "Recycle basics (paper/plastic)",
        "Recycle + some compost",
        "Recycle + compost consistently"
      ]
    },
    {
      id: "waterUsage",
      text: "Water usage at home (showers, laundry, etc.)",
      type: "choice",
      options: [
        "High",
        "Moderate",
        "Low",
        "Very low / water-efficient fixtures"
      ]
    },
    {
      id: "flightsPerYear",
      text: "How many round-trip flights per year?",
      type: "choice",
      options: [
        "6+",
        "3-5",
        "1-2",
        "0"
      ]
    },
    {
      id: "homeSize",
      text: "Approximate home size",
      type: "choice",
      options: [
        "Large house (2000+ sq ft)",
        "Medium house (1000-2000 sq ft)",
        "Small apt/house (<1000 sq ft)",
        "Shared / dorm / co-living"
      ]
    },
    {
      id: "wfhDays",
      text: "Days working from home per week",
      type: "choice",
      options: [
        "0",
        "1-2",
        "3-4",
        "5+"
      ]
    }
  ]

  // Get the current question object
  const question = questions[currentStep]

  // STEP 4: Function to update answers when user types/selects
  function handleAnswerChange(value) {
    setAnswers({
      ...answers,           // Keep all existing answers
      [question.id]: value  // Update just this question's answer
    })
  }

  // STEP 5: Function for "Next" button
  function handleNext() {
    // If not on last question, go to next question
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // If on last question, submit the quiz
      submitQuiz()
    }
  }

  // STEP 6: Function for "Back" button
  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // STEP 7: Submit all answers to the API
  async function submitQuiz() {
    console.log("Submitting answers:", answers)

    try {
      const response = await fetch('/api/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      })
      console.log("fetching posts")

      let data = { success: false }
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (e) {
          data = { success: false }
        }
      }

      if (response.ok && data.success) {
        // Save user ID and answers for later
        localStorage.setItem('basque_user_id', data.userId)
        localStorage.setItem('basque_answers', JSON.stringify(answers))
        // Go to results page
        router.push('/results')
      } else {
        // Fallback: still show results using local answers
        localStorage.setItem('basque_answers', JSON.stringify(answers))
        router.push('/results')
      }
    } catch (error) {
      console.error('Error:', error)
      // Fallback: still show results using local answers
      localStorage.setItem('basque_answers', JSON.stringify(answers))
      router.push('/results')
    }
  }

  // STEP 8: Check if current question has been answered
  const isAnswered = answers[question.id] && answers[question.id].toString().trim() !== ""

  // STEP 9: Render the UI
  return (
    <div className="min-h-screen">
      

      {/* Progress Bar */}
      <div className="bg-card-background shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="bg-card-background rounded-3xl shadow-xl p-10 max-w-2xl w-full card">
          
          {/* Question Title */}
          <h1 className="text-3xl font-bold text-default-foreground mb-8">
            {question.text}
          </h1>

          {/* Text Input (for ZIP code) */}
          {question.type === "text" && (
            <input
              type="text"
              value={answers[question.id]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={question.placeholder}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg
                         focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}

          {/* Multiple Choice */}
          {question.type === "choice" && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswerChange(option)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition
                    ${answers[question.id] === option
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                    }`}
                >
                  <span className="text-default-foreground font-medium">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {/* Back Button (only show if not on first question) */}
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-default-foreground py-3 rounded-xl 
                           font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
            )}
            
            {/* Next/Submit Button */}
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`flex-1 py-3 rounded-xl font-semibold transition shadow-md
                ${isAnswered
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-default-foreground cursor-not-allowed'
                }`}
            >
              {currentStep === questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}