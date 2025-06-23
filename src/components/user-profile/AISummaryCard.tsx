import { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BrainCircuit } from "lucide-react";
import DecoratedSummary from "./DecoratedSummary";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AISummaryCardProps {
  initialSummary?: string | null;
  onInsightGenerated: (insight: string) => void;
  rateLimitMessage?: string | null;
}

const parseInsight = (insight: string): string => {
  try {
    const data = JSON.parse(insight);

    if (Array.isArray(data.steps)) {
      const toolOutputStep = [...data.steps].reverse().find(step => step.type === 'tool_output');
      if (toolOutputStep && typeof toolOutputStep.content === 'string') {
        return toolOutputStep.content;
      }
    }

    if (typeof data.answer === 'string') {
      try {
        const nestedData = JSON.parse(data.answer);
        if (nestedData && typeof nestedData.finalAnswerPrompt === 'string') {
          return nestedData.finalAnswerPrompt;
        }
      } catch (e) {
        // It's not a nested JSON, so the answer is the content.
        return data.answer;
      }
    }
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return insight;
  }
}

const AISummaryCard = ({ initialSummary, onInsightGenerated, rateLimitMessage }: AISummaryCardProps) => {
  const { user } = useClerk();
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSummary) {
      setSummary(parseInsight(initialSummary));
    }
  }, [initialSummary]);

  const handleGenerateSummary = async () => {
    if (!user?.username) {
      setError("Username is not available. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3008/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: `Summarize all the journals from the user ${user.username} for 1 month`,
          stream: false,
          dev: true,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorJson = JSON.parse(responseText);
          throw new Error(errorJson.message || responseText);
        } catch (e) {
          throw new Error(responseText || `HTTP error! status: ${response.status}`);
        }
      }

      // The raw response is saved, but the parsed content is displayed.
      onInsightGenerated(responseText);
      setSummary(parseInsight(responseText));

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setSummary("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-md transition-shadow duration-300 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          AI Summary & Analysis
        </CardTitle>
        <BrainCircuit className="h-6 w-6 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="mt-2 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
              <p>Generating your summary...</p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {summary && !isLoading && !error && (
            <DecoratedSummary summary={summary} />
          )}

          {!summary && !isLoading && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unlock insights from your journal entries. Our AI can provide
              summaries, identify patterns, and offer analysis on your
              well-being.
            </p>
          )}
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="w-full">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoading || !!rateLimitMessage}
                  className="mt-4 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Generating..."
                    : summary
                    ? "Regenerate Insights"
                    : "Generate AI Insights"}
                </button>
              </div>
            </TooltipTrigger>
            {rateLimitMessage && (
              <TooltipContent>
                <p>{rateLimitMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default AISummaryCard; 