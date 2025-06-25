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
  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-wrap gap-2">
        {moodOptions.map(({ name, imagePath, bgColor, textColor }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectMood(selectedMood === name ? null : name)}
            className={`
              flex flex-col items-center justify-center p-1 rounded-lg shadow-sm 
              transition-all duration-150 ease-in-out w-14
              ${bgColor} ${textColor}
              ${
                selectedMood === name
                  ? "ring-2 ring-offset-1 ring-indigo-500 scale-105"
                  : "hover:opacity-80 hover:scale-105"
              }
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400
            `}
          >
            <img src={imagePath} alt={name} className="w-8 h-8" />
            <span className="text-xs font-medium">{name.toLowerCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector; 