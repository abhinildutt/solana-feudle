import React from 'react';

type Props = {
  timeMs: number;
  show: boolean;
};

export const StopwatchText = ({ timeMs, show }: Props) => {
  if (!show) {
    return null;
  }

  // Utility functions for time checks
  const isTimeRunningOut = (timeMs: number) => timeMs > 30000 && timeMs <= 35000;
  const isOpponentClose = (timeMs: number) => timeMs <= 65000 && timeMs > 60000;

  const getFormattedTime = () => {
    if (isTimeRunningOut(timeMs)) {
      return <div className="animate-pulse text-red-500">Time's running out!</div>;
    } else if (isOpponentClose(timeMs)) {
      return <div className="text-yellow-500">Opponent's pretty close!</div>;
    }
    const MS_IN_HOUR = 1000 * 60 * 60;
    const sliceStart = Math.floor(timeMs / MS_IN_HOUR) % 24 > 0 ? 11 : 14;
    return new Date(timeMs).toISOString().slice(sliceStart, 19);
  };

  // Main container classes
  const containerClasses = `
    flex flex-col items-center justify-center
    mx-2 my-2
    dark:text-white text-4xl font-semibold
    bg-gray-800 text-white
    rounded-lg shadow-md
    p-4
    transition duration-500 ease-in-out
    w-80
    overflow-hidden
    absolute left-40 transform -translate-x-full

  `;

  // Additional box classes
  const additionalBoxClasses = `
    mt-4 p-3
    bg-gray-700 text-white
    rounded shadow
    text-center text-xl
    w-full
  `;

  return (
    <div className={containerClasses}>
      <div>{getFormattedTime()}</div>
      <div className={additionalBoxClasses}>
        Stay focused, you're doing great!
      </div>
    </div>
  );
};
