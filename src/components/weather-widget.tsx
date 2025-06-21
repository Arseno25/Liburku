'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface WeatherData {
  temperature: number;
  weathercode: number;
}

// WMO Weather interpretation codes (WW)
const weatherIcons: { [key: number]: React.ComponentType<{ className?: string }> } = {
  0: Sun, // Clear sky
  1: CloudSun, // Mainly clear
  2: CloudSun, // Partly cloudy
  3: Cloud, // Overcast
  45: CloudFog, // Fog
  48: CloudFog, // depositing rime fog
  51: CloudDrizzle, // Drizzle: Light
  53: CloudDrizzle, // Drizzle: moderate
  55: CloudDrizzle, // Drizzle: dense intensity
  56: CloudDrizzle, // Freezing Drizzle: Light
  57: CloudDrizzle, // Freezing Drizzle: dense
  61: CloudRain, // Rain: Slight
  63: CloudRain, // Rain: moderate
  65: CloudRain, // Rain: heavy intensity
  66: CloudRain, // Freezing Rain: Light
  67: CloudRain, // Freezing Rain: heavy intensity
  71: CloudSnow, // Snow fall: Slight
  73: CloudSnow, // Snow fall: moderate
  75: CloudSnow, // Snow fall: heavy intensity
  77: CloudSnow, // Snow grains
  80: CloudRain, // Rain showers: Slight
  81: CloudRain, // Rain showers: moderate
  82: CloudRain, // Rain showers: violent
  85: CloudSnow, // Snow showers slight
  86: CloudSnow, // Snow showers heavy
  95: CloudLightning, // Thunderstorm: Slight or moderate
  96: CloudLightning, // Thunderstorm with slight
  99: CloudLightning, // Thunderstorm with heavy hail
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch weather data.');
          }
          const data = await response.json();
          if (data && data.current) {
            setWeather({
              temperature: Math.round(data.current.temperature_2m),
              weathercode: data.current.weather_code,
            });
          } else {
             throw new Error('Invalid weather data format.');
          }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  }, []);

  const WeatherIcon = weather ? weatherIcons[weather.weathercode] || Cloud : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-12 h-6 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" title={error}>
            <AlertCircle className="w-5 h-5 text-destructive/80" />
            <span className="hidden sm:inline">Cuaca Error</span>
        </div>
    );
  }

  if (weather && WeatherIcon) {
    return (
      <div className="flex items-center gap-2 text-foreground font-medium">
        <WeatherIcon className="w-6 h-6 text-primary" />
        <span>{weather.temperature}°C</span>
      </div>
    );
  }

  return null;
}
