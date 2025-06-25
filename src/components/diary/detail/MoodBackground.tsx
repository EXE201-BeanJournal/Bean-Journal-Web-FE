import { useMemo } from 'react';
import './MoodBackground.css';
import { Mood } from './MoodSelector';

interface MoodBackgroundProps {
  mood: Mood | string | null | undefined;
}

const Confetti = () => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
  const confettiPieces = useMemo(() => Array.from({ length: 100 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 5}s`,
      animationDelay: `${Math.random() * 20}s`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      transform: `rotate(${Math.random() * 360}deg)`,
    };
    return <div key={i} className="confetti-piece" style={style} />;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return <div className="confetti">{confettiPieces}</div>;
};

const Rain = () => {
  const raindrops = useMemo(() => Array.from({ length: 100 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animationDuration: `${0.5 + Math.random() * 5}s`,
      animationDelay: `${Math.random() * 10}s`,
    };
    return <div key={i} className="raindrop" style={style} />;
  }), []);

  return (
    <div className="rain-background">
      <div className="raindrops">{raindrops}</div>
    </div>
  );
};

const Storm = () => {
  return (
    <div className="storm-background">
      <div className="storm-cloud cloud1" />
      <div className="storm-cloud cloud2" />
      <div className="storm-cloud cloud3" />
      <div className="lightning" />
    </div>
  );
};

const Sunny = () => {
    return (
        <div className="sunny-background">
            <div className="sun"></div>
            <div className="cloud cloud1"></div>
            <div className="cloud cloud2"></div>
            <div className="cloud cloud3"></div>
        </div>
    );
};

const MoodBackground = ({ mood }: MoodBackgroundProps) => {
  const renderBackground = () => {
    switch (mood) {
      case 'amazing':
        return <Confetti />;
      case 'happy':
        return <Sunny />;
      case 'sad':
        return <Rain />;
      case 'mad':
        return <Storm />;
      case 'neutral':
      default:
        return null;
    }
  };

  return (
    <div className="mood-background-container">
      {renderBackground()}
    </div>
  );
};

export default MoodBackground; 