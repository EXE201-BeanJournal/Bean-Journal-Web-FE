import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StreakModal } from "./StreakModal";

interface StreakManagementProps {
  supabase: SupabaseClient;
  userId: string; // userId is expected to be available
  externallyTriggeredOpen: boolean;
  onClose: () => void;
}

const StreakManagement: React.FC<StreakManagementProps> = ({ 
  supabase, 
  userId, 
  externallyTriggeredOpen,
  onClose
}) => {
  const [internalShowTrigger, setInternalShowTrigger] = useState(false);

  const handleCloseAndNotify = () => {
    setInternalShowTrigger(false);
    onClose();
  };

  // Effect to automatically show the modal once per day
  useEffect(() => {
    const getLocalYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const lastVisit = localStorage.getItem("beanJourney_lastVisit");
    const todayLocalStr = getLocalYYYYMMDD(now);

    if (!lastVisit || lastVisit !== todayLocalStr) {
      localStorage.setItem("beanJourney_lastVisit", todayLocalStr);
      setInternalShowTrigger(true);
    }
    // This effect should run once on component mount.
    // Pass an empty dependency array.
  }, []);

  const isModalEffectivelyOpen = internalShowTrigger || externallyTriggeredOpen;

  return (
    <StreakModal
      isOpen={isModalEffectivelyOpen}
      onClose={handleCloseAndNotify}
      supabase={supabase}
      userId={userId}
    />
  );
};

export default StreakManagement; 