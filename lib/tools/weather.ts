import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the current weather for a specific location.",
  inputSchema: z.object({
    location: z.string().describe("The city or location to get the weather for (e.g., 'San Francisco', 'London')"),
  }),
  execute: async ({ location }) => {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        return { error: `Location '${location}' not found.` };
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      
      if (!weatherData.current_weather) {
        return { error: "Weather data not available." };
      }
      
      return {
        location: `${name}, ${country}`,
        temperature_celsius: weatherData.current_weather.temperature,
        windspeed_kmh: weatherData.current_weather.windspeed,
        time: weatherData.current_weather.time,
      };
    } catch (error) {
      console.error("Weather Tool Error:", error);
      return { error: "Failed to fetch weather data." };
    }
  },
});
