import React from "react";

const LineChart = ({ data, labels }) => {
  if (!data || data.length === 0 || Math.max(...data) === 0) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data);
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - (value / maxValue) * 100,
  }));

  return (
    <div className="relative w-full h-40 bg-gray-100 p-2 rounded">
      <svg className="w-full h-full">
        <polyline
          fill="none"
          stroke="#4BC0C0"
          strokeWidth="2"
          points={points.map((p) => `${p.x}%,${p.y}%`).join(" ")}
        />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={`${point.x}%`}
            cy={`${point.y}%`}
            r="3"
            fill="#4BC0C0"
          />
        ))}
      </svg>
      <div className="mt-2 text-center text-xs">
        {labels.map((label, index) => (
          <div key={index}>
            {label}: {data[index]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
