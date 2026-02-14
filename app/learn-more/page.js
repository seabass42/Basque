export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">

      {/* Top Bar */}
      <div className="bg-green-700 py-4 px-6 shadow-md">
        <h2 className="text-white text-lg font-semibold tracking-wide">
          Basque — Learn More
        </h2>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center px-6 py-20">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center">

          <h1 className="text-4xl font-bold text-green-700 mb-6">
            Why Basque?
          </h1>

          <p className="text-gray-700 text-lg leading-relaxed">
            Basque helps individuals turn climate awareness into measurable action.
            By personalizing recommendations and tracking real-world impact,
            we make sustainability simple, accessible, and community-driven.
          </p>

        </div>
      </div>

    </div>
  )
}