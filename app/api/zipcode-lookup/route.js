import { NextResponse } from 'next/server'

// State abbreviation to emoji mapping
const STATE_SYMBOLS = {
  'AL': '⭐', 'AK': '❄️', 'AZ': '🌵', 'AR': '💎',
  'CA': '🐻', 'CO': '⛰️', 'CT': '⚓', 'DE': '💙',
  'FL': '🌴', 'GA': '🍑', 'HI': '🌺', 'ID': '🥔',
  'IL': '🌽', 'IN': '🏎️', 'IA': '🌾', 'KS': '🌻',
  'KY': '🐴', 'LA': '🎺', 'ME': '🦞', 'MD': '🦀',
  'MA': '⛵', 'MI': '🚗', 'MN': '🏒', 'MS': '🎸',
  'MO': '🎭', 'MT': '🏔️', 'NE': '🌽', 'NV': '🎰',
  'NH': '🍁', 'NJ': '🌊', 'NM': '🌶️', 'NY': '🗽',
  'NC': '✈️', 'ND': '🦬', 'OH': '🏈', 'OK': '🤠',
  'OR': '🌲', 'PA': '🔔', 'RI': '⚓', 'SC': '🏖️',
  'SD': '🗻', 'TN': '🎵', 'TX': '⭐', 'UT': '⛷️',
  'VT': '🍁', 'VA': '🏛️', 'WA': '🌲', 'WV': '⛰️',
  'WI': '🧀', 'WY': '🦌', 'DC': '🏛️'
}

// State colors for visual badges
const STATE_COLORS = {
  'AL': '#C8102E', 'AK': '#0D3B66', 'AZ': '#CD5C5C', 'AR': '#0066CC',
  'CA': '#FDB515', 'CO': '#003F87', 'CT': '#00247D', 'DE': '#006EB6',
  'FL': '#EE7F2D', 'GA': '#CC0000', 'HI': '#0052A5', 'ID': '#2E5090',
  'IL': '#E84A27', 'IN': '#002868', 'IA': '#FFD700', 'KS': '#0033A0',
  'KY': '#003DA5', 'LA': '#003087', 'ME': '#003DA5', 'MD': '#E03C31',
  'MA': '#003F87', 'MI': '#002F6C', 'MN': '#003F87', 'MS': '#003087',
  'MO': '#003F87', 'MT': '#003F87', 'NE': '#FFD700', 'NV': '#003F87',
  'NH': '#003F87', 'NJ': '#E84A27', 'NM': '#FFD700', 'NY': '#003F87',
  'NC': '#003087', 'ND': '#0033A0', 'OH': '#C8102E', 'OK': '#0033A0',
  'OR': '#003F87', 'PA': '#003F87', 'RI': '#0033A0', 'SC': '#003087',
  'SD': '#003F87', 'TN': '#C8102E', 'TX': '#002868', 'UT': '#002868',
  'VT': '#003F87', 'VA': '#003087', 'WA': '#00534C', 'WV': '#0033A0',
  'WI': '#003F87', 'WY': '#003F87', 'DC': '#CC0000'
}

// GET /api/zipcode-lookup?zip=94107
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zip')

    if (!zipCode) {
      return NextResponse.json(
        { success: false, error: 'ZIP code is required' },
        { status: 400 }
      )
    }

    // Validate ZIP code format (5 digits)
    if (!/^\d{5}$/.test(zipCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ZIP code format' },
        { status: 400 }
      )
    }

    console.log(`🔍 Looking up ZIP code: ${zipCode}`)

    // Use FREE zippopotam.us API (no key needed!)
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'ZIP code not found' },
          { status: 404 }
        )
      }
      throw new Error('Failed to fetch ZIP code data')
    }

    const data = await response.json()
    
    // Extract location data
    const place = data.places[0]
    const cityName = place['place name']
    const stateAbbr = place['state abbreviation']
    const stateName = place['state']
    const latitude = parseFloat(place.latitude)
    const longitude = parseFloat(place.longitude)

    // Get state symbol and color
    const stateSymbol = STATE_SYMBOLS[stateAbbr] || '🏴'
    const stateColor = STATE_COLORS[stateAbbr] || '#003F87'

    console.log(`✅ Found: ${cityName}, ${stateAbbr} ${stateSymbol}`)

    return NextResponse.json({
      success: true,
      zipCode,
      city: cityName,
      state: {
        abbreviation: stateAbbr,
        name: stateName,
        symbol: stateSymbol,
        color: stateColor
      },
      displayName: `${cityName}, ${stateAbbr}`,
      fullLocation: `${cityName}, ${stateName}`,
      coordinates: {
        latitude,
        longitude
      }
    })

  } catch (error) {
    console.error('❌ Error looking up ZIP code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to lookup ZIP code' },
      { status: 500 }
    )
  }
}