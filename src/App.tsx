import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Search, Wind, Droplets, Eye, Thermometer, MapPin, Clock } from 'lucide-react'
import './App.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

interface WeatherData {
  name: string
  sys: { country: string; sunrise: number; sunset: number }
  main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number; pressure: number }
  weather: { description: string; icon: string; main: string }[]
  wind: { speed: number; deg: number }
  visibility: number
  dt: number
}

interface ForecastItem {
  dt: number
  main: { temp: number; temp_min: number; temp_max: number }
  weather: { description: string; icon: string; main: string }[]
  dt_txt: string
}

interface ForecastData {
  list: ForecastItem[]
}

const weatherBg: Record<string, string> = {
  Clear: 'from-amber-900 via-orange-900 to-yellow-900',
  Clouds: 'from-slate-800 via-gray-800 to-zinc-900',
  Rain: 'from-blue-950 via-slate-900 to-indigo-950',
  Drizzle: 'from-blue-900 via-slate-800 to-cyan-950',
  Thunderstorm: 'from-gray-950 via-purple-950 to-slate-900',
  Snow: 'from-slate-700 via-blue-900 to-slate-800',
  Mist: 'from-gray-800 via-slate-700 to-gray-900',
  default: 'from-slate-900 via-gray-900 to-zinc-900',
}

const getDailyForecast = (list: ForecastItem[]) => {
  const days: Record<string, ForecastItem[]> = {}
  list.forEach(item => {
    const day = item.dt_txt.split(' ')[0]
    if (!days[day]) days[day] = []
    days[day].push(item)
  })
  return Object.entries(days).slice(1, 6).map(([date, items]) => ({
    date,
    min: Math.min(...items.map(i => i.main.temp_min)),
    max: Math.max(...items.map(i => i.main.temp_max)),
    icon: items[4]?.weather[0]?.icon || items[0].weather[0].icon,
    desc: items[4]?.weather[0]?.description || items[0].weather[0].description,
  }))
}

const formatTime = (unix: number) =>
  new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

export default function App() {
  const [city, setCity] = useState('Lagos')
  const [input, setInput] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchWeather = useCallback(async (cityName: string) => {
    setLoading(true)
    setError('')
    try {
      const [w, f] = await Promise.all([
        axios.get(`${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`),
        axios.get(`${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric`),
      ])
      setWeather(w.data)
      setForecast(f.data)
    } catch {
      setError('City not found. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWeather(city) }, [city, fetchWeather])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) { setCity(input.trim()); setInput('') }
  }

  const bg = weather ? (weatherBg[weather.weather[0].main] || weatherBg.default) : weatherBg.default
  const daily = forecast ? getDailyForecast(forecast.list) : []

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bg} transition-all duration-1000 font-sans`}>
      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <div className="relative max-w-2xl mx-auto px-4 py-10 min-h-screen flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              SkyPulse
            </h1>
            <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Search city..."
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 text-sm backdrop-blur-sm focus:outline-none focus:border-white/40 w-44"
            />
            <button type="submit" className="bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl p-2 text-white transition backdrop-blur-sm">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl py-3">{error}</p>}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {weather && !loading && (
          <>
            {/* Main Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {weather.name}, {weather.sys.country}
                  </div>
                  <div className="text-8xl font-bold tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {Math.round(weather.main.temp)}°
                  </div>
                  <p className="text-white/70 capitalize text-lg mt-1">{weather.weather[0].description}</p>
                  <p className="text-white/40 text-sm mt-1">
                    Feels like {Math.round(weather.main.feels_like)}° · H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°
                  </p>
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt={weather.weather[0].description}
                  className="w-32 h-32 -mt-4 drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Droplets className="w-4 h-4" />, label: 'Humidity', value: `${weather.main.humidity}%` },
                { icon: <Wind className="w-4 h-4" />, label: 'Wind Speed', value: `${weather.wind.speed} m/s` },
                { icon: <Eye className="w-4 h-4" />, label: 'Visibility', value: `${(weather.visibility / 1000).toFixed(1)} km` },
                { icon: <Thermometer className="w-4 h-4" />, label: 'Pressure', value: `${weather.main.pressure} hPa` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white flex items-center gap-3">
                  <div className="text-white/50">{icon}</div>
                  <div>
                    <p className="text-white/50 text-xs">{label}</p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sunrise / Sunset */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white flex justify-around">
              <div className="text-center">
                <p className="text-white/50 text-xs mb-1">🌅 Sunrise</p>
                <p className="font-semibold">{formatTime(weather.sys.sunrise)}</p>
              </div>
              <div className="w-px bg-white/15" />
              <div className="text-center">
                <p className="text-white/50 text-xs mb-1">🌇 Sunset</p>
                <p className="font-semibold">{formatTime(weather.sys.sunset)}</p>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {daily.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white">
                <p className="text-white/50 text-xs mb-3 uppercase tracking-widest">5-Day Forecast</p>
                <div className="flex flex-col gap-3">
                  {daily.map(d => (
                    <div key={d.date} className="flex items-center justify-between">
                      <p className="text-sm w-32 text-white/70">{formatDay(d.date)}</p>
                      <img src={`https://openweathermap.org/img/wn/${d.icon}.png`} alt={d.desc} className="w-8 h-8" />
                      <p className="text-xs text-white/50 flex-1 text-center capitalize">{d.desc}</p>
                      <p className="text-sm font-semibold">{Math.round(d.max)}° <span className="text-white/40 font-normal">{Math.round(d.min)}°</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
    </div>
  )
}
