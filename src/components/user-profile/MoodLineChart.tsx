import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { type DailyAverageMood } from "./MoodChart";

// Map mood values to labels for the Y-axis
const moodValueToLabel: { [key: number]: string } = {
  1: "Mad",
  2: "Sad",
  3: "Neutral",
  4: "Happy",
  5: "Amazing",
};

interface MoodLineChartProps {
  data: DailyAverageMood[];
}

const MoodLineChart = ({ data }: MoodLineChartProps) => {
  if (!data || data.length === 0) {
    return null; // Or some placeholder
  }

  // Custom Tooltip formatter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const moodValue = payload[0].value;
      const moodLabel = moodValueToLabel[Math.round(moodValue)] || "N/A";
      return (
        <div className="p-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="label text-sm font-semibold">{`${label}`}</p>
          <p className="intro text-xs">{`Avg. Mood: ${moodLabel} (${moodValue.toFixed(
            2
          )})`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="dayAbbreviation"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tickFormatter={(value) => moodValueToLabel[value]}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="averageMood"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />

        {/* Reference lines for context */}
        <ReferenceLine
          y={3}
          stroke="gray"
          strokeDasharray="3 3"
          strokeOpacity={0.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MoodLineChart; 