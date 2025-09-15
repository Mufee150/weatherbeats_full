const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// Connect to MongoDB Atlas
const MONGODB_URI = "";
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
    initializeDatabase();
  })
  .catch(err => {
    console.error('Could not connect to MongoDB Atlas:', err);
    process.exit(1);
  });

// Define the schema for weather-to-music mappings
const weatherMappingSchema = new mongoose.Schema({
  weatherCondition: String,
  mood: String,
  suggestedGenre: String,
});

const MoodMapping = mongoose.model('moodmappings', weatherMappingSchema);

// Middleware
app.use(cors());
app.use(express.json());

const SPOTIFY_CLIENT_ID = '';
const SPOTIFY_CLIENT_SECRET = '';
const OPENWEATHER_API_KEY = "";

let spotifyAccessToken = '';
let tokenExpirationTime = 0;

// Function to get clothing suggestions based on weather
function getClothingSuggestion(weatherCondition, tempCelsius, tempFahrenheit) {
  const suggestions = {
    outfit: [],
    accessories: [],
    footwear: [],
    tips: []
  };

  // Temperature-based clothing
  if (tempCelsius >= 30) { // Hot (86°F+)
    suggestions.outfit.push('Light cotton t-shirt or tank top');
    suggestions.outfit.push('Shorts or light sundress');
    suggestions.accessories.push('Sunglasses');
    suggestions.accessories.push('Sun hat or cap');
    suggestions.footwear.push('Sandals or breathable sneakers');
    suggestions.tips.push('Stay hydrated and seek shade');
    suggestions.tips.push('Use sunscreen SPF 30+');
  } else if (tempCelsius >= 25) { // Warm (77-85°F)
    suggestions.outfit.push('Light shirt or blouse');
    suggestions.outfit.push('Light pants, skirt, or shorts');
    suggestions.accessories.push('Sunglasses');
    suggestions.footwear.push('Comfortable shoes or sandals');
    suggestions.tips.push('Perfect weather for outdoor activities');
  } else if (tempCelsius >= 20) { // Mild (68-76°F)
    suggestions.outfit.push('Long-sleeve shirt or light sweater');
    suggestions.outfit.push('Jeans or light pants');
    suggestions.footwear.push('Sneakers or casual shoes');
    suggestions.tips.push('Great weather for walking');
  } else if (tempCelsius >= 15) { // Cool (59-67°F)
    suggestions.outfit.push('Sweater or light jacket');
    suggestions.outfit.push('Long pants or jeans');
    suggestions.accessories.push('Light scarf (optional)');
    suggestions.footwear.push('Closed shoes or boots');
    suggestions.tips.push('Perfect for layering');
  } else if (tempCelsius >= 10) { // Cold (50-58°F)
    suggestions.outfit.push('Warm jacket or coat');
    suggestions.outfit.push('Sweater or hoodie');
    suggestions.outfit.push('Long pants or jeans');
    suggestions.accessories.push('Scarf and beanie');
    suggestions.footwear.push('Boots or warm shoes');
    suggestions.tips.push('Layer up for warmth');
  } else if (tempCelsius >= 0) { // Very Cold (32-49°F)
    suggestions.outfit.push('Heavy winter coat');
    suggestions.outfit.push('Thick sweater or fleece');
    suggestions.outfit.push('Thermal underwear');
    suggestions.outfit.push('Warm pants or jeans');
    suggestions.accessories.push('Warm scarf, beanie, and gloves');
    suggestions.footwear.push('Insulated boots');
    suggestions.tips.push('Cover exposed skin');
    suggestions.tips.push('Stay warm and dry');
  } else { // Freezing (Below 32°F)
    suggestions.outfit.push('Heavy winter parka');
    suggestions.outfit.push('Multiple layers (thermal + sweater)');
    suggestions.outfit.push('Thermal underwear');
    suggestions.outfit.push('Warm winter pants');
    suggestions.accessories.push('Warm hat, scarf, and insulated gloves');
    suggestions.footwear.push('Waterproof insulated boots');
    suggestions.tips.push('Minimize time outdoors');
    suggestions.tips.push('Watch for signs of frostbite');
  }

  // Weather condition-specific additions
  switch (weatherCondition.toLowerCase()) {
    case 'rain':
    case 'drizzle':
      suggestions.accessories.push('Umbrella');
      suggestions.outfit.unshift('Waterproof jacket or raincoat');
      suggestions.footwear = ['Waterproof shoes or rain boots'];
      suggestions.tips.push('Stay dry to avoid getting cold');
      break;
    
    case 'thunderstorm':
      suggestions.accessories.push('Umbrella (be cautious of lightning)');
      suggestions.outfit.unshift('Waterproof jacket');
      suggestions.footwear = ['Waterproof boots with good grip'];
      suggestions.tips.push('Avoid open areas during storms');
      suggestions.tips.push('Stay indoors if possible');
      break;
    
    case 'snow':
      suggestions.accessories.push('Waterproof gloves');
      suggestions.accessories.push('Warm hat that covers ears');
      suggestions.outfit.unshift('Waterproof winter jacket');
      suggestions.footwear = ['Insulated waterproof boots with good traction'];
      suggestions.tips.push('Layer up and stay dry');
      suggestions.tips.push('Watch for icy conditions');
      break;
    
    case 'mist':
    case 'fog':
    case 'haze':
      suggestions.accessories.push('Light jacket (visibility may be low)');
      suggestions.tips.push('Drive carefully - reduced visibility');
      suggestions.tips.push('Wear bright colors for visibility');
      break;
    
    case 'clear':
      if (tempCelsius >= 25) {
        suggestions.accessories.push('Sunglasses are essential');
        suggestions.tips.push('Great day to be outside!');
      }
      break;
    
    case 'clouds':
      suggestions.tips.push('Comfortable weather for any activity');
      break;
  }

  return suggestions;
}

// Function to convert Kelvin to Celsius and Fahrenheit
function convertTemperature(kelvin) {
  const celsius = Math.round(kelvin - 273.15);
  const fahrenheit = Math.round((celsius * 9/5) + 32);
  return { celsius, fahrenheit };
}

// Function to initialize database with sample data
async function initializeDatabase() {
  try {
    const count = await MoodMapping.countDocuments();
    if (count === 0) {
      console.log('📦 Database is empty, adding sample mood mappings...');
      
      const sampleMappings = [
        // Clear weather mappings
        { weatherCondition: 'Clear', mood: 'Happy', suggestedGenre: 'pop' },
        { weatherCondition: 'Clear', mood: 'Calm', suggestedGenre: 'indie' },
        { weatherCondition: 'Clear', mood: 'Energetic', suggestedGenre: 'electronic' },
        { weatherCondition: 'Clear', mood: 'Cozy', suggestedGenre: 'folk' },
        { weatherCondition: 'Clear', mood: 'Sad', suggestedGenre: 'indie' },
        { weatherCondition: 'Clear', mood: 'Anxious', suggestedGenre: 'ambient' },
        { weatherCondition: 'Clear', mood: 'Tired', suggestedGenre: 'lo-fi' },
        
        // Cloudy weather mappings
        { weatherCondition: 'Clouds', mood: 'Happy', suggestedGenre: 'indie rock' },
        { weatherCondition: 'Clouds', mood: 'Calm', suggestedGenre: 'alternative' },
        { weatherCondition: 'Clouds', mood: 'Energetic', suggestedGenre: 'rock' },
        { weatherCondition: 'Clouds', mood: 'Cozy', suggestedGenre: 'indie folk' },
        { weatherCondition: 'Clouds', mood: 'Sad', suggestedGenre: 'melancholy' },
        { weatherCondition: 'Clouds', mood: 'Anxious', suggestedGenre: 'chill' },
        { weatherCondition: 'Clouds', mood: 'Tired', suggestedGenre: 'acoustic' },
        
        // Rainy weather mappings
        { weatherCondition: 'Rain', mood: 'Happy', suggestedGenre: 'jazz' },
        { weatherCondition: 'Rain', mood: 'Calm', suggestedGenre: 'rain sounds' },
        { weatherCondition: 'Rain', mood: 'Energetic', suggestedGenre: 'drum and bass' },
        { weatherCondition: 'Rain', mood: 'Cozy', suggestedGenre: 'coffee shop' },
        { weatherCondition: 'Rain', mood: 'Sad', suggestedGenre: 'sad songs' },
        { weatherCondition: 'Rain', mood: 'Anxious', suggestedGenre: 'meditation' },
        { weatherCondition: 'Rain', mood: 'Tired', suggestedGenre: 'sleep music' },
        
        // Additional weather conditions
        { weatherCondition: 'Snow', mood: 'Happy', suggestedGenre: 'christmas' },
        { weatherCondition: 'Snow', mood: 'Calm', suggestedGenre: 'winter chill' },
        { weatherCondition: 'Thunderstorm', mood: 'Energetic', suggestedGenre: 'metal' },
        { weatherCondition: 'Drizzle', mood: 'Calm', suggestedGenre: 'lo-fi hip hop' },
      ];
      
      await MoodMapping.insertMany(sampleMappings);
      console.log(`✅ Added ${sampleMappings.length} sample mood mappings to database`);
    } else {
      console.log(`📊 Found ${count} existing mood mappings in database`);
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Function to get a Spotify access token
async function getSpotifyAccessToken() {
  const now = new Date().getTime();
  if (spotifyAccessToken && now < tokenExpirationTime) {
    return spotifyAccessToken;
  }

  const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`,
        },
      }
    );
    spotifyAccessToken = response.data.access_token;
    tokenExpirationTime = now + (response.data.expires_in * 1000);
    return spotifyAccessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to authenticate with Spotify API.');
  }
}

// Improved function to find a Spotify playlist with null safety
async function getSpotifyPlaylist(genre) {
  try {
    console.log('🎵 Searching for genre:', genre);
    
    const accessToken = await getSpotifyAccessToken();
    
    // Try multiple search strategies
    const searchQueries = [
      `${genre}`,
      `${genre} music`,
      `${genre} playlist`,
      `best of ${genre}`,
      `${genre} hits`
    ];
    
    for (const query of searchQueries) {
      console.log(`🔍 Trying search query: "${query}"`);
      
      try {
        const response = await axios.get('https://api.spotify.com/v1/search', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            type: 'playlist',
            limit: 20,
            market: 'US',
          },
        });

        const playlists = response.data.playlists?.items || [];
        console.log(`📋 Found ${playlists.length} playlists for "${query}"`);
        
        if (playlists.length > 0) {
          const validPlaylists = playlists.filter(playlist => {
            return playlist && 
                   playlist.name && 
                   playlist.external_urls && 
                   playlist.external_urls.spotify &&
                   playlist.owner &&
                   playlist.owner.display_name;
          });
          
          console.log(`✅ Found ${validPlaylists.length} valid playlists`);
          
          if (validPlaylists.length === 0) {
            console.log('⚠️ All playlists have null/invalid data, trying next query');
            continue;
          }
          
          console.log('📝 Valid playlists:', validPlaylists.slice(0, 5).map(p => p.name));
          
          const genreLower = genre.toLowerCase();
          
          let relevantPlaylist = validPlaylists.find(playlist => {
            const name = playlist.name.toLowerCase();
            return name.includes(genreLower) && 
                   !name.includes('instrumental') && 
                   !name.includes('chill out') &&
                   !name.includes('sleep');
          });
          
          if (!relevantPlaylist) {
            relevantPlaylist = validPlaylists.find(playlist => {
              const name = playlist.name.toLowerCase();
              return !name.includes('instrumental') && 
                     !name.includes('ambient') && 
                     !name.includes('sleep') &&
                     !name.includes('meditation');
            });
          }
          
          if (!relevantPlaylist) {
            relevantPlaylist = validPlaylists[0];
          }
          
          console.log(`✅ Selected playlist: "${relevantPlaylist.name}" by ${relevantPlaylist.owner.display_name}`);
          return relevantPlaylist.external_urls.spotify;
        }
      } catch (searchError) {
        console.error(`❌ Error with search query "${query}":`, searchError.message);
        continue;
      }
    }
    
    console.log('⚠️ No valid playlists found, trying category search');
    return await getSpotifyPlaylistByCategory(genre);
    
  } catch (error) {
    console.error('❌ Error searching for Spotify playlist:', error.message);
    return 'https://open.spotify.com/';
  }
}

// Alternative approach: Use featured playlists by category
async function getSpotifyPlaylistByCategory(genre) {
  try {
    const accessToken = await getSpotifyAccessToken();
    
    const genreToCategory = {
      'pop': 'pop',
      'rock': 'rock',
      'indie': 'indie_alt',
      'indie rock': 'indie_alt',
      'indie folk': 'indie_alt',
      'alternative': 'indie_alt',
      'electronic': 'edm_dance',
      'jazz': 'jazz',
      'folk': 'folk',
      'metal': 'metal',
      'hip-hop': 'hiphop',
      'hip hop': 'hiphop',
      'rap': 'hiphop',
      'r&b': 'rnb',
      'country': 'country',
      'classical': 'classical',
      'blues': 'blues',
      'reggae': 'reggae',
      'punk': 'punk',
      'funk': 'funk',
      'soul': 'soul',
      'chill': 'chill',
      'lo-fi': 'chill',
      'lo-fi hip hop': 'chill',
      'ambient': 'chill',
      'acoustic': 'acoustic',
      'workout': 'workout',
      'party': 'party'
    };
    
    const categoryId = genreToCategory[genre.toLowerCase()];
    
    if (categoryId) {
      console.log(`🏷️ Trying category: ${categoryId}`);
      
      const response = await axios.get(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          limit: 10,
          country: 'US'
        },
      });
      
      if (response.data.playlists && response.data.playlists.items.length > 0) {
        const validPlaylists = response.data.playlists.items.filter(playlist => 
          playlist && playlist.name && playlist.external_urls && playlist.external_urls.spotify
        );
        
        if (validPlaylists.length > 0) {
          const playlist = validPlaylists[0];
          console.log(`✅ Found category playlist: "${playlist.name}"`);
          return playlist.external_urls.spotify;
        }
      }
    }
    
    console.log('⚠️ No category found or no valid playlists in category, using default');
    return 'https://open.spotify.com/browse/featured';
    
  } catch (error) {
    console.error('❌ Error getting category playlist:', error.message);
    return 'https://open.spotify.com/browse/featured';
  }
}

// Enhanced API endpoint with clothing suggestions
app.get('/api/weather', async (req, res) => {
  const { lat, lon, mood } = req.query;

  if (!lat || !lon || !mood) {
    return res.status(400).json({ error: 'Latitude, longitude, and mood are required.' });
  }

  try {
    console.log(`🌤️ Fetching weather for coordinates: ${lat}, ${lon} with mood: ${mood}`);
    
    // 1. Fetch weather from OpenWeather API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    const weatherResponse = await axios.get(weatherUrl);
    const weatherCondition = weatherResponse.data.weather[0].main;
    const weatherDescription = weatherResponse.data.weather[0].description;
    const city = weatherResponse.data.name;
    const tempKelvin = weatherResponse.data.main.temp;
    const feelsLikeKelvin = weatherResponse.data.main.feels_like;
    const humidity = weatherResponse.data.main.humidity;
    
    // Convert temperatures
    const temp = convertTemperature(tempKelvin);
    const feelsLike = convertTemperature(feelsLikeKelvin);

    console.log(`🌤️ Weather: ${weatherCondition} (${weatherDescription}) in ${city}`);
    console.log(`🌡️ Temperature: ${temp.celsius}°C / ${temp.fahrenheit}°F (feels like ${feelsLike.celsius}°C)`);

    // 2. Find music genre from MongoDB based on weather and mood
    console.log(`🔍 Looking for mapping: weatherCondition=${weatherCondition}, mood=${mood}`);
    
    const weatherMapping = await MoodMapping.findOne({ 
      weatherCondition: weatherCondition, 
      mood: mood 
    });
    
    let suggestedGenre = 'pop';
    
    if (weatherMapping) {
      suggestedGenre = weatherMapping.suggestedGenre;
      console.log(`✅ Found mapping: ${suggestedGenre}`);
    } else {
      console.log(`⚠️ No mapping found for ${weatherCondition} + ${mood}, using default: ${suggestedGenre}`);
    }

    // 3. Get clothing suggestions
    console.log(`👕 Getting clothing suggestions for ${weatherCondition} at ${temp.celsius}°C`);
    const clothingSuggestions = getClothingSuggestion(weatherCondition, temp.celsius, temp.fahrenheit);

    // 4. Get Spotify playlist URL
    console.log(`🎵 Getting playlist for genre: ${suggestedGenre}`);
    const playlistUrl = await getSpotifyPlaylist(suggestedGenre);

    console.log(`✅ Final playlist URL: ${playlistUrl}`);

    res.status(200).json({
      weather: {
        condition: weatherCondition,
        description: weatherDescription,
        city: city,
        temperature: {
          celsius: temp.celsius,
          fahrenheit: temp.fahrenheit,
          feelsLike: {
            celsius: feelsLike.celsius,
            fahrenheit: feelsLike.fahrenheit
          }
        },
        humidity: humidity
      },
      music: {
        suggestedGenre: suggestedGenre,
        playlistUrl: playlistUrl || 'https://open.spotify.com/browse/featured',
      },
      clothing: clothingSuggestions
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});

// Debug endpoint to check database mappings
app.get('/api/debug/mappings', async (req, res) => {
  try {
    const mappings = await MoodMapping.find({});
    res.json({
      count: mappings.length,
      mappings: mappings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test Spotify search
app.get('/api/debug/spotify/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const playlistUrl = await getSpotifyPlaylist(genre);
    res.json({
      genre: genre,
      playlistUrl: playlistUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test clothing suggestions
app.get('/api/debug/clothing/:condition/:temp', async (req, res) => {
  try {
    const { condition, temp } = req.params;
    const tempCelsius = parseInt(temp);
    const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
    const suggestions = getClothingSuggestion(condition, tempCelsius, tempFahrenheit);
    res.json({
      weather: condition,
      temperature: { celsius: tempCelsius, fahrenheit: tempFahrenheit },
      suggestions: suggestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to manually add mappings
app.post('/api/mappings', async (req, res) => {
  try {
    const { weatherCondition, mood, suggestedGenre } = req.body;
    
    if (!weatherCondition || !mood || !suggestedGenre) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const mapping = new MoodMapping({ weatherCondition, mood, suggestedGenre });
    await mapping.save();
    
    res.json({ message: 'Mapping added successfully', mapping });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 WeatherBeats backend listening at http://localhost:${port}`);
  console.log(`📊 Debug endpoints:`);
  console.log(`   GET /api/debug/mappings - View all database mappings`);
  console.log(`   GET /api/debug/spotify/:genre - Test Spotify search for a genre`);
  console.log(`   GET /api/debug/clothing/:condition/:temp - Test clothing suggestions`);
  console.log(`   POST /api/mappings - Add new mapping`);
});