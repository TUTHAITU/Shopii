import React from "react";

const BarChart = ({ data, labels }) => {
  const maxValue = Math.max(...data);
  const barWidth = 100 / data.length;

  return (
    <div className="flex justify-around items-end h-40 bg-gray-100 p-2 rounded">
      {data.map((value, index) => (
        <div key={index} className="flex-1 mx-1">
          <div
            className="bg-blue-500 rounded-t"
            style={{
              height: `${(value / maxValue) * 100}%`,
              width: `${barWidth}%`,
            }}
          ></div>
          <p className="text-center text-sm">{labels[index]}</p>
          <p className="text-center text-xs">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
