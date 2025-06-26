import React, { useState, useEffect } from 'react';
import { JournalEntry, Profile } from '@/types/supabase'; // Import JournalEntry and Profile types
import { useNavigate } from '@tanstack/react-router'; // Import useNavigate
import { BookOpen, Clock, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';

interface HeaderCardProps {
    journalEntries: JournalEntry[]; // Add journalEntries prop
    userProfile: Profile; // Add userProfile prop
}

interface WeatherData {
    current_weather: {
        temperature: number;
        weathercode: number;
    };
}

const getWeatherInfo = (weatherCode: number): { className: string; description: string; darkText: boolean; icon: React.ElementType } => {
    if (weatherCode <= 1) return { className: 'weather-clear', description: 'Clear skies', darkText: false, icon: Sun };
    if (weatherCode <= 3) return { className: 'weather-cloudy', description: 'Partly cloudy', darkText: false, icon: Cloud };
    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) return { className: 'weather-rainy', description: 'Rainy day', darkText: true, icon: CloudRain };
    if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) return { className: 'weather-snowy', description: 'Snowy day', darkText: false, icon: CloudSnow };
    if (weatherCode === 45 || weatherCode === 48) return { className: 'weather-foggy', description: 'Foggy day', darkText: false, icon: CloudFog };
    if (weatherCode >= 95 && weatherCode <= 99) return { className: 'weather-stormy', description: 'Stormy weather', darkText: true, icon: CloudLightning };
    return { className: 'weather-clear', description: 'A great day!', darkText: false, icon: Sun }; // Default fallback
}

const HeaderCard: React.FC<HeaderCardProps> = ({ journalEntries }) => {
    const totalEntries = journalEntries.length;
    let latestEntryDateString = "No entries yet";
    const navigate = useNavigate();

    const [weather, setWeather] = useState<{
        data: WeatherData | null;
        className: string;
        description: string;
        darkText: boolean;
        icon: React.ElementType;
        error: string | null;
    }>({
        data: null,
        className: 'weather-clear',
        description: 'Loading weather...',
        darkText: false,
        icon: Sun,
        error: null,
    });

    useEffect(() => {
        const fetchWeatherData = async (latitude: number, longitude: number) => {
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
                if (!response.ok) throw new Error('Failed to fetch weather data.');
                const data: WeatherData = await response.json();
                const { className, description, darkText, icon } = getWeatherInfo(data.current_weather.weathercode);
                setWeather({ data, className, description, darkText, icon, error: null });
            } catch (error) {
                console.error(error);
                setWeather(prev => ({ ...prev, error: 'Could not fetch weather data. Displaying default.' }));
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeatherData(position.coords.latitude, position.coords.longitude),
                (error) => {
                    console.error("Geolocation error:", error.message);
                    setWeather(prev => ({ ...prev, error: 'Could not get location. Displaying default.' }));
                    // Fallback to a default location (e.g., London) if user denies location
                    fetchWeatherData(51.5074, -0.1278);
                }
            );
        } else {
            setWeather(prev => ({ ...prev, error: 'Geolocation is not supported. Displaying default.' }));
            fetchWeatherData(51.5074, -0.1278); // Fallback for non-supporting browsers
        }
    }, []);

    if (totalEntries > 0) {
        // Sort entries by date to find the most recent one
        const sortedEntries = [...journalEntries].sort((a, b) => 
            new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime()
        );
        const latestEntry = sortedEntries[0];
        if (latestEntry && latestEntry.entry_timestamp) {
            const date = new Date(latestEntry.entry_timestamp);
            latestEntryDateString = `Latest updated: ${date.toLocaleDateString('en-US', {
                month: 'short', 
                day: 'numeric', 
                year: 'numeric'
            })}`;
        }
    }

    const handleCreateNewDiary = () => {
        navigate({ to: '/journal/diary', search: { createNew: true } });
    };

    const WeatherIcon = weather.icon;

    return (
        <div className={`bg-white rounded-lg p-8 shadow-sm mb-8 relative overflow-hidden h-[270px] dynamic-weather-background ${weather.className} ${weather.darkText ? 'dark-weather-text' : ''}`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Top Section: Greeting and Weather */}
                <div>
                    <p className="text-gray-500 text-[18px] font-normal mb-2 font-['Readex_Pro']">
                        What a great day to learn something new
                    </p>
                    <div className="flex items-center">
                        <h1 className="text-[38px] font-normal text-[#2f2569] mr-4 font-['Readex_Pro']">
                            {weather.data ? `${Math.round(weather.data.current_weather.temperature)}°C, ${weather.description}` : weather.description}
                        </h1>
                        <WeatherIcon className="w-10 h-10" />
                    </div>
                     {weather.error && <p className="text-sm text-red-400 mt-1">{weather.error}</p>}
                </div>

                {/* Bottom Section: Stats and Action Button */}
                <div className="flex justify-between items-end">
                    {/* Stats */}
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-3" />
                            <span className="text-[16px] font-normal font-['Readex_Pro']">Diaries: {totalEntries}</span>
                        </div>
                        <div className="flex items-center">
                            <Clock className="w-5 h-5 mr-3" />
                            <span className="text-[16px] font-normal font-['Readex_Pro']">{latestEntryDateString}</span>
                        </div>
                    </div>

                    {/* "Have anything awesome today?" text with button */}
                    <div className="flex items-center">
                        <span className="text-black w-[8rem] text-[16px] font-['Readex_Pro'] mr-3">Have anything awesome today?</span>
                        <button 
                            className="bg-[#f2e7ff] w-10 h-10 rounded-md flex items-center justify-center border-[0.1rem] border-[#9645FF] hover:bg-[#e8d6ff] transition-colors"
                            onClick={handleCreateNewDiary}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9645ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaderCard; 