import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/Button';
import { Smile } from 'lucide-react';

export type Mood = "amazing" | "happy" | "neutral" | "sad" | "mad";

interface MoodSelectorProps {
  selectedMood: string | null | undefined;
  onSelectMood: (mood: string | null) => void;
}

const moodOptions: {
  name: Mood;
  imagePath: string;
  bgColor: string;
  textColor: string;
}[] = [
  {
    name: "amazing",
    imagePath: "/images/bean-journey/figma/emoji_face_01.png",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  {
    name: "happy",
    imagePath: "/images/bean-journey/figma/emoji_face_02.png",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    name: "neutral",
    imagePath: "/images/bean-journey/figma/emoji_face_03.png",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  {
    name: "sad",
    imagePath: "/images/bean-journey/figma/emoji_face_04.png",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    name: "mad",
    imagePath: "/images/bean-journey/figma/emoji_face_05.png",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
];

const MoodSelector = ({ selectedMood, onSelectMood }: MoodSelectorProps) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedOption = moodOptions.find(o => o.name === selectedMood);
  
    const handleSelect = (name: Mood) => {
      onSelectMood(selectedMood === name ? null : name);
      setIsOpen(false);
    };
  
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-white">
            {selectedOption ? (
              <img src={selectedOption.imagePath} alt={selectedOption.name} className="w-10 h-10" />
            ) : (
              <Smile className="w-5 h-5 text-slate-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex flex-col gap-1 p-2">
            {moodOptions.map(option => (
              <button
                key={option.name}
                onClick={() => handleSelect(option.name)}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors w-full text-left hover:bg-slate-100 ${option.textColor} ${selectedMood === option.name ? option.bgColor : ''}`}
              >
                <img src={option.imagePath} alt={option.name} className="w-6 h-6" />
                <span className="font-medium text-sm capitalize">{option.name}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
};

export default MoodSelector; 