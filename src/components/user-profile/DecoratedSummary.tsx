import React from "react";
import {
  Sun,
  HeartPulse,
  Lightbulb,
  CheckCircle,
  BrainCircuit,
  ThumbsUp,
  Target,
  Clock,
  Users,
  Bug,
  Paintbrush,
  Heart,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DecoratedSummaryProps {
  summary: string;
}

const getIcon = (
  title: string
): { icon: React.ElementType; color: string } | null => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("summary"))
    return { icon: Sun, color: "text-yellow-500" };
  if (lowerTitle.includes("mood") || lowerTitle.includes("analysis"))
    return { icon: HeartPulse, color: "text-red-500" };
  if (lowerTitle.includes("insight"))
    return { icon: Lightbulb, color: "text-blue-500" };
  if (
    lowerTitle.includes("suggestion") ||
    lowerTitle.includes("improvement") ||
    lowerTitle.includes("reflection")
  )
    return { icon: Lightbulb, color: "text-teal-500" };
  if (lowerTitle.includes("strength") || lowerTitle.includes("positive"))
    return { icon: ThumbsUp, color: "text-green-500" };
  if (lowerTitle.includes("resilience"))
    return { icon: Zap, color: "text-yellow-400" };
  if (
    lowerTitle.includes("creativity") ||
    lowerTitle.includes("problem-solving")
  )
    return { icon: Paintbrush, color: "text-orange-500" };
  if (lowerTitle.includes("focus") || lowerTitle.includes("determination"))
    return { icon: Target, color: "text-red-600" };
  if (lowerTitle.includes("time management"))
    return { icon: Clock, color: "text-cyan-500" };
  if (lowerTitle.includes("collaboration"))
    return { icon: Users, color: "text-indigo-500" };
  if (lowerTitle.includes("error") || lowerTitle.includes("debug"))
    return { icon: Bug, color: "text-rose-500" };
  if (lowerTitle.includes("self-care"))
    return { icon: Heart, color: "text-pink-500" };
  if (lowerTitle.includes("memory zone"))
    return { icon: BrainCircuit, color: "text-purple-400" };

  return null;
};

interface ContentRendererProps {
  content: string;
}

const ContentRenderer = ({ content }: ContentRendererProps) => {
  const lines = content
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const elements: JSX.Element[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.startsWith("*") || /^\d+\./.test(trimmedLine)) {
      const listItems: string[] = [];
      const isNumberedList = /^\d+\./.test(trimmedLine);

      while (i < lines.length) {
        const currentLine = lines[i].trim();
        const isCurrentNumbered = /^\d+\./.test(currentLine);
        const isCurrentBullet = currentLine.startsWith("*");

        if (
          (isNumberedList && isCurrentNumbered) ||
          (!isNumberedList && isCurrentBullet)
        ) {
          listItems.push(currentLine);
          i++;
        } else {
          break;
        }
      }

      elements.push(
        <div className="space-y-3 mt-2" key={`list-group-${elements.length}`}>
          {listItems.map((listItem, itemIndex) => {
            const cleanLine = listItem.replace(/^\d+\.\s*|\*\s*/, "").trim();
            const parts = cleanLine.split(/:(.*)/s);
            const hasBoldTitle =
              parts.length > 1 &&
              parts[0].startsWith("**") &&
              parts[0].endsWith("**");

            if (hasBoldTitle) {
              const title = parts[0].replace(/\*\*/g, "");
              const itemContent = parts[1].trim();
              const iconInfo = getIcon(title);
              const { icon: Icon, color } = iconInfo || {
                icon: BrainCircuit,
                color: "text-purple-400",
              };

              return (
                <div
                  key={itemIndex}
                  className="p-3 bg-gray-50/50 dark:bg-gray-800/60 rounded-lg border border-white/30 dark:border-gray-700/50"
                >
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 ${color} mr-3 flex-shrink-0`} />
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">
                      {title}
                    </h4>
                  </div>
                  <p className="pl-8 pt-1 text-sm text-gray-600 dark:text-gray-300">
                    {itemContent}
                  </p>
                </div>
              );
            }

            const iconInfo = getIcon(cleanLine);
            const { icon: Icon, color } = iconInfo || {
              icon: CheckCircle,
              color: "text-green-500",
            };
            return (
              <div key={itemIndex} className="flex items-start">
                <Icon className={`h-5 w-5 ${color} mr-3 mt-1 flex-shrink-0`} />
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {cleanLine}
                </p>
              </div>
            );
          })}
        </div>
      );
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          className={"text-gray-600 dark:text-gray-300"}
        >
          {trimmedLine}
        </p>
      );
      i++;
    }
  }

  return <div className="text-sm space-y-2">{elements}</div>;
};

interface Section {
  title: string;
  content: string;
}

const DecoratedSummary: React.FC<DecoratedSummaryProps> = ({ summary }) => {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  const rawLines = summary
    .split("\n")
    .filter((s) => s.trim() && !s.trim().startsWith("==="));

  rawLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
      const title = trimmedLine.replace(/\*\*/g, "").trim();
      currentSection = { title, content: "" };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + trimmedLine;
    }
  });

  if (sections.length === 0) {
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-white/20 dark:bg-gray-700/30 rounded-lg shadow-inner">
        {summary}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {sections.map((section, index) => {
        const iconInfo = getIcon(section.title);
        const { icon: Icon, color } = iconInfo || {
          icon: CheckCircle,
          color: "text-gray-500",
        };

        return (
          <AccordionItem
            value={`item-${index}`}
            key={index}
            className="bg-white/30 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/60 rounded-xl shadow-md px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center">
                <Icon className={`h-6 w-6 ${color}`} />
                <h3 className="ml-3 text-lg font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                  {section.title}
                </h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <ContentRenderer content={section.content} />
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default DecoratedSummary;
