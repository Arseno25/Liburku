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
  weatherCode: number;
  weatherDescription: string;
  location: string;
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

const wmoWeatherCodes: { [key: number]: string } = {
  0: 'Cerah',
  1: 'Cerah Berawan',
  2: 'Berawan Sebagian',
  3: 'Berawan',
  45: 'Berkabut',
  48: 'Kabut Reif',
  51: 'Gerimis Ringan',
  53: 'Gerimis Sedang',
  55: 'Gerimis Lebat',
  56: 'Gerimis Beku Ringan',
  57: 'Gerimis Beku Lebat',
  61: 'Hujan Ringan',
  63: 'Hujan Sedang',
  65: 'Hujan Lebat',
  66: 'Hujan Beku Ringan',
  67: 'Hujan Beku Lebat',
  71: 'Salju Ringan',
  73: 'Salju Sedang',
  75: 'Salju Lebat',
  77: 'Butiran Salju',
  80: 'Hujan Ringan',
  81: 'Hujan Sedang',
  82: 'Hujan Deras',
  85: 'Hujan Salju Ringan',
  86: 'Hujan Salju Lebat',
  95: 'Badai Petir',
  96: 'Badai Petir & Hujan Es',
  99: 'Badai Petir & Hujan Es Lebat',
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const weatherResponsePromise = fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          // Using a free, no-key-required reverse geocoding service
          const locationResponsePromise = fetch(
            `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
          );

          const [weatherResponse, locationResponse] = await Promise.all([
            weatherResponsePromise,
            locationResponsePromise,
          ]);

          if (!weatherResponse.ok) {
            throw new Error('Gagal mengambil data cuaca.');
          }
          if (!locationResponse.ok) {
            throw new Error('Gagal mengambil data lokasi.');
          }
          
          const weatherData = await weatherResponse.json();
          const locationData = await locationResponse.json();
          
          if (!weatherData?.current) {
            throw new Error('Format data cuaca tidak valid.');
          }

          const weatherCode = weatherData.current.weather_code;
          const description = wmoWeatherCodes[weatherCode] || 'Cuaca tidak diketahui';
          
          const city = locationData.address?.city || locationData.address?.town || locationData.address?.village || locationData.address?.county;
          const locationString = city || 'Lokasi tidak diketahui';

          setWeather({
            temperature: Math.round(weatherData.current.temperature_2m),
            weatherCode: weatherCode,
            weatherDescription: description,
            location: locationString,
          });

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Terjadi kesalahan tidak diketahui.');
            }
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (err.code === 1) { // PERMISSION_DENIED
            setError("Aktifkan izin lokasi untuk melihat cuaca.");
        } else {
            setError('Tidak dapat mengambil lokasi Anda.');
        }
        setLoading(false);
      }
    );
  }, []);

  const WeatherIcon = weather ? weatherIcons[weather.weatherCode] || Cloud : null;

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex flex-col gap-1.5">
            <Skeleton className="w-24 h-4 rounded-md" />
            <Skeleton className="w-16 h-4 rounded-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" title={error}>
            <AlertCircle className="w-5 h-5 text-destructive/80" />
            <span>{error}</span>
        </div>
    );
  }

  if (weather && WeatherIcon) {
    return (
      <div className="flex items-center gap-3" title={`Cuaca di ${weather.location}`}>
        <WeatherIcon className="w-8 h-8 text-primary shrink-0" />
        <div className="text-sm font-medium text-foreground">
            <div>{weather.temperature}°C, {weather.weatherDescription}</div>
            <div className="text-xs text-muted-foreground font-normal">{weather.location}</div>
        </div>
      </div>
    );
  }

  return null;
}
