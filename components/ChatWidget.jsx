"use client"
import { useEffect, useRef, useState } from 'react'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Basque Assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null) // State to store userId
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    // Retrieve userId from localStorage when component mounts
    const storedUserId = localStorage.getItem('basque_user_id')
    if (storedUserId) {
      setUserId(storedUserId)
    }
  }, [])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, userId: userId }) // Include userId
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Request failed')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }
      ])
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button (shown only when closed) */}
      {!open && (
        <button
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-green-600 text-white shadow-2xl hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3.75h9M12 3.75c-4.97 0-9 3.358-9 7.5 0 1.875.777 3.6 2.082 4.938-.224.977-.731 2.295-1.588 3.9 0 0 2.25-.375 4.14-1.702A10.956 10.956 0 0012 18.75c4.97 0 9-3.358 9-7.5s-4.03-7.5-9-7.5z"
            />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-3xl bg-white text-gray-800 shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-green-600 text-white px-4 py-3">
            <div className="font-semibold">Basque Assistant</div>
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="hover:bg-green-700/30 rounded p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Messages area styled like a mobile texting app */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm border ${
                    m.role === 'user'
                      ? 'bg-green-600 text-white border-green-600 rounded-br-sm'
                      : 'bg-white text-gray-800 border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Message Basque Assistant"
                className="flex-1 resize-none rounded-2xl border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="px-4 py-2 rounded-2xl bg-green-600 text-white disabled:opacity-50 hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}