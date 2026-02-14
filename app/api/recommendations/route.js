import { NextResponse } from 'next/server'
import { load } from 'cheerio'

// Lightweight fetch with timeout
async function safeFetch(url, { timeout = 4000 } = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
    const text = await res.text()
    return text
  } finally {
    clearTimeout(id)
  }
}

function buildStaticResources(answers) {
  const { diet = '', transportation = '', homeEnergy = '', recycling = '', waterUsage = '' } = answers || {}

  const articles = []
  const mealPlans = []
  const improvements = []

  // Transportation-based tips
  if (transportation === 'Drive alone') {
    improvements.push({
      title: 'Try Carpooling or Transit Two Days a Week',
      description: 'Reduce solo driving by coordinating carpools or using public transit for recurring trips.',
      link: 'https://www.ridesharing.com/'
    })
    articles.push({
      title: 'Beginner Guide to Using Public Transit Effectively',
      link: 'https://www.transitapp.com/'
    })
  } else if (transportation === 'Carpool') {
    improvements.push({
      title: 'Plan Errands in One Trip',
      description: 'Batch errands to minimize mileage and cold starts, saving fuel and emissions.',
      link: 'https://www.fueleconomy.gov/feg/driveHabits.jsp'
    })
  } else if (transportation === 'Public transit' || transportation === 'Bike/Walk') {
    improvements.push({
      title: 'Keep up the Low-Carbon Commute',
      description: 'Maintain or increase your transit/biking days and share tips with neighbors.',
      link: 'https://www.transportation.gov/sustainability'
    })
  }

  // Diet-based plans
  if (diet === 'Meat with most meals') {
    mealPlans.push({
      title: 'Start with 2 Plant-Forward Dinners/Week',
      items: [
        { name: 'Lentil Bolognese', link: 'https://www.budgetbytes.com/vegan-lentil-bolognese/' },
        { name: 'Chickpea Tacos', link: 'https://www.acouplecooks.com/chickpea-tacos/' }
      ]
    })
    articles.push({
      title: 'How to Transition to a Plant-Forward Diet',
      link: 'https://www.hsph.harvard.edu/nutritionsource/healthy-weight/healthy-eating-plate/'
    })
  } else if (diet === 'Meat sometimes') {
    mealPlans.push({
      title: 'Flexitarian Meal Ideas',
      items: [
        { name: 'Mushroom Stroganoff', link: 'https://www.bbcgoodfood.com/recipes/mushroom-stroganoff' },
        { name: 'Grilled Veggie Bowls', link: 'https://www.loveandlemons.com/grain-bowl/' }
      ]
    })
  } else {
    mealPlans.push({
      title: 'Plant-Based Staples',
      items: [
        { name: 'Tofu Stir-Fry', link: 'https://www.loveandlemons.com/tofu-stir-fry/' },
        { name: 'Red Curry with Veggies', link: 'https://minimalistbaker.com/easy-red-curry-with-tofu/' }
      ]
    })
  }

  // Home energy
  if (homeEnergy.includes('gas')) {
    improvements.push({
      title: 'Electrify Appliances Over Time',
      description: 'When replacing equipment, consider heat pumps and induction cooking for lower emissions and improved indoor air quality.',
      link: 'https://www.energy.gov/energysaver/heat-pump-systems'
    })
  }

  // Recycling and water
  if (recycling && !recycling.toLowerCase().includes('consistently')) {
    improvements.push({
      title: 'Set Up a Simple Compost System',
      description: 'Start with a countertop bin and city collection guide to divert food waste.',
      link: 'https://www.epa.gov/recycle/composting-home'
    })
  }
  if (waterUsage === 'High' || waterUsage === 'Moderate') {
    improvements.push({
      title: 'Install Water-Efficient Fixtures',
      description: 'Swap in low-flow showerheads and faucet aerators to reduce hot water use.',
      link: 'https://www.epa.gov/watersense'
    })
  }

  // General articles
  articles.push(
    { title: 'Home Energy Efficiency Basics', link: 'https://www.energy.gov/energysaver/energy-saver' },
    { title: 'Recycling Made Easy', link: 'https://www.epa.gov/recycle' }
  )

  return { articles, mealPlans, improvements }
}

async function scrapeHeadings(url, selector = 'a') {
  try {
    const html = await safeFetch(url)
    const $ = load(html)
    const links = []
    $(selector).each((_, el) => {
      const text = $(el).text().trim()
      const href = $(el).attr('href')
      if (text && href && href.startsWith('http')) {
        links.push({ title: text, link: href })
      }
    })
    return links.slice(0, 5)
  } catch (e) {
    return []
  }
}

export async function POST(request) {
  try {
    const answers = await request.json()

    const base = buildStaticResources(answers)

    // Try to enrich improvements with light scraping
    const scrapedEnergy = await scrapeHeadings('https://www.energy.gov/energysaver/energy-saver', 'a')
    const scrapedRecycling = await scrapeHeadings('https://www.epa.gov/recycle', 'a')

    const enrichedArticles = [
      ...base.articles,
      ...scrapedEnergy.slice(0, 2),
      ...scrapedRecycling.slice(0, 2)
    ]

    return NextResponse.json({
      success: true,
      articles: enrichedArticles,
      mealPlans: base.mealPlans,
      improvements: base.improvements
    })
  } catch (error) {
    console.error('Error building recommendations:', error)
    return NextResponse.json({ success: false, error: 'Failed to build recommendations' }, { status: 500 })
  }
}