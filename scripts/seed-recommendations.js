require('dotenv').config({ path: '.env.local' })
const { MongoClient } = require('mongodb')

const recommendations = [
  // TRANSPORTATION RECOMMENDATIONS
  {
    title: "Try carpooling to work",
    description: "Share rides with coworkers or use carpooling apps to reduce your commute emissions by up to 50%",
    category: "transportation",
    pointValue: 100,
    impactMetric: "Saves ~500kg CO2/year",
    difficulty: "easy",
    tags: ["transportation", "commute", "high-impact"],
    showIf: {
      transportation: ["Drive alone"]
    }
  },
  {
    title: "Use public transit once a week",
    description: "Replace one car trip per week with bus, train, or subway",
    category: "transportation",
    pointValue: 75,
    impactMetric: "Saves ~250kg CO2/year",
    difficulty: "easy",
    tags: ["transportation", "commute", "medium-impact"],
    showIf: {
      transportation: ["Drive alone", "Carpool"]
    }
  },
  {
    title: "Bike for short trips",
    description: "For trips under 3 miles, consider biking instead of driving",
    category: "transportation",
    pointValue: 50,
    impactMetric: "Saves ~100kg CO2/year",
    difficulty: "medium",
    tags: ["transportation", "health", "low-impact"],
    showIf: {
      transportation: ["Drive alone", "Carpool"]
    }
  },

  // DIET RECOMMENDATIONS
  {
    title: "Try Meatless Mondays",
    description: "Skip meat one day per week to reduce your carbon footprint",
    category: "diet",
    pointValue: 80,
    impactMetric: "Saves ~300kg CO2/year",
    difficulty: "easy",
    tags: ["diet", "food", "high-impact"],
    showIf: {
      diet: ["Meat with most meals", "Meat sometimes"]
    }
  },
  {
    title: "Reduce beef consumption",
    description: "Beef has the highest carbon footprint. Try chicken, fish, or plant-based alternatives",
    category: "diet",
    pointValue: 150,
    impactMetric: "Saves ~700kg CO2/year",
    difficulty: "medium",
    tags: ["diet", "food", "very-high-impact"],
    showIf: {
      diet: ["Meat with most meals"]
    }
  },
  {
    title: "Buy local and seasonal produce",
    description: "Reduce transportation emissions by choosing locally grown, seasonal fruits and vegetables",
    category: "diet",
    pointValue: 60,
    impactMetric: "Saves ~150kg CO2/year",
    difficulty: "easy",
    tags: ["diet", "food", "shopping", "medium-impact"],
    showIf: {
      diet: ["Meat with most meals", "Meat sometimes", "Vegetarian", "Mostly plant-based"]
    }
  },
  {
    title: "Reduce food waste",
    description: "Plan meals, store food properly, and compost scraps to minimize waste",
    category: "diet",
    pointValue: 70,
    impactMetric: "Saves ~200kg CO2/year",
    difficulty: "easy",
    tags: ["diet", "food", "waste", "medium-impact"],
    showIf: {
      diet: ["Meat with most meals", "Meat sometimes", "Vegetarian", "Mostly plant-based"]
    }
  },

  // ENERGY RECOMMENDATIONS
  {
    title: "Switch to LED bulbs",
    description: "Replace incandescent bulbs with energy-efficient LEDs throughout your home",
    category: "energy",
    pointValue: 50,
    impactMetric: "Saves $75/year, 200kg CO2/year",
    difficulty: "easy",
    tags: ["energy", "home", "cost-saving", "medium-impact"],
    showIf: {
      // Show to everyone - universal recommendation
    }
  },
  {
    title: "Unplug devices when not in use",
    description: "Phantom power drain can account for 10% of your electricity bill",
    category: "energy",
    pointValue: 40,
    impactMetric: "Saves $100/year, 150kg CO2/year",
    difficulty: "easy",
    tags: ["energy", "home", "cost-saving", "low-impact"],
    showIf: {
      // Universal
    }
  },
  {
    title: "Use a programmable thermostat",
    description: "Automatically adjust temperature when you're away to save energy",
    category: "energy",
    pointValue: 100,
    impactMetric: "Saves $180/year, 800kg CO2/year",
    difficulty: "medium",
    tags: ["energy", "home", "cost-saving", "high-impact"],
    showIf: {
      // Universal
    }
  },
  {
    title: "Install solar panels",
    description: "Generate clean energy and reduce your reliance on fossil fuels",
    category: "energy",
    pointValue: 500,
    impactMetric: "Saves $1000+/year, 3000kg CO2/year",
    difficulty: "hard",
    tags: ["energy", "home", "investment", "very-high-impact"],
    showIf: {
      // Universal but requires investment
    }
  },

  // SHOPPING & CONSUMPTION
  {
    title: "Bring reusable bags",
    description: "Use cloth bags instead of plastic or paper for shopping",
    category: "shopping",
    pointValue: 30,
    impactMetric: "Prevents ~100 plastic bags/year",
    difficulty: "easy",
    tags: ["shopping", "waste", "low-impact"],
    showIf: {
      // Universal
    }
  },
  {
    title: "Buy secondhand when possible",
    description: "Shop thrift stores or online marketplaces for clothing and household items",
    category: "shopping",
    pointValue: 90,
    impactMetric: "Saves ~400kg CO2/year",
    difficulty: "easy",
    tags: ["shopping", "waste", "cost-saving", "high-impact"],
    showIf: {
      // Universal
    }
  },
  {
    title: "Choose products with minimal packaging",
    description: "Opt for items with less plastic and recyclable packaging",
    category: "shopping",
    pointValue: 50,
    impactMetric: "Reduces ~50kg waste/year",
    difficulty: "easy",
    tags: ["shopping", "waste", "medium-impact"],
    showIf: {
      // Universal
    }
  },

  // WATER CONSERVATION
  {
    title: "Install low-flow showerheads",
    description: "Reduce water usage by up to 50% without sacrificing pressure",
    category: "water",
    pointValue: 60,
    impactMetric: "Saves 7,000 gallons/year, $100/year",
    difficulty: "easy",
    tags: ["water", "home", "cost-saving", "medium-impact"],
    showIf: {
      // Universal
    }
  },
  {
    title: "Fix leaky faucets",
    description: "A dripping faucet can waste 3,000 gallons per year",
    category: "water",
    pointValue: 40,
    impactMetric: "Saves 3,000 gallons/year, $30/year",
    difficulty: "easy",
    tags: ["water", "home", "cost-saving", "low-impact"],
    showIf: {
      // Universal
    }
  }
]

async function seedRecommendations() {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    console.error('❌ Missing MONGODB_URI environment variable')
    console.log('Make sure you have a .env.local file with your MongoDB connection string')
    process.exit(1)
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db('basque')
    const collection = db.collection('recommendations')

    // Clear existing recommendations (optional - comment out if you want to keep them)
    await collection.deleteMany({})
    console.log('🗑️  Cleared existing recommendations')

    // Insert all recommendations
    const result = await collection.insertMany(recommendations)
    console.log(`✨ Inserted ${result.insertedCount} recommendations`)

    // Create an index on category for faster queries
    await collection.createIndex({ category: 1 })
    console.log('📊 Created index on category field')

    // Create a text index for search (if you want to add search later)
    await collection.createIndex({ 
      title: "text", 
      description: "text",
      category: "text" 
    })
    console.log('🔍 Created text search index')

    console.log('\n🎉 Recommendations seeded successfully!')
    console.log('\nYou can now view them in MongoDB Atlas:')
    console.log('1. Go to your cluster')
    console.log('2. Click "Browse Collections"')
    console.log('3. Select "basque" database → "recommendations" collection')

  } catch (error) {
    console.error('❌ Error seeding recommendations:', error)
  } finally {
    await client.close()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run the seed function
seedRecommendations()