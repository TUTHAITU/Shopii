import React from "react";

const PieChart = ({ data, labels }) => {
  const total = data.reduce((sum, value) => sum + value, 0);
  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

  return (
    <div className="relative w-40 h-40 mx-auto">
      {data.map((value, index) => {
        const percentage = (value / total) * 100;
        const rotation =
          index === 0
            ? 0
            : data
                .slice(0, index)
                .reduce((sum, v) => sum + (v / total) * 360, 0);
        return (
          <div
            key={index}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              clipPath: `polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%, ${
                50 +
                50 * Math.cos(((rotation + percentage / 2) * Math.PI) / 180)
              }% ${
                50 +
                50 * Math.sin(((rotation + percentage / 2) * Math.PI) / 180)
              }%)`,
              backgroundColor: colors[index % colors.length],
              transform: `rotate(${rotation}deg)`,
            }}
          ></div>
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center text-sm">
        <p>Total: {total}</p>
      </div>
      <div className="mt-2 text-center text-xs">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center">
            <span
              className="w-3 h-3 inline-block mr-1"
              style={{ backgroundColor: colors[index % colors.length] }}
            ></span>
            {label}: {data[index]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
