import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { calculateLiveDuration } from '../utils/dateUtils';

/**
 * Isolated LiveTimer component.
 * Extracts the 1-second interval state out of heavy screens (like CheckIn and Dashboard)
 * to prevent forcing the entire screen to re-render 60 times a minute.
 */
const LiveTimer = ({ startTime, textStyle }) => {
  const [liveTimer, setLiveTimer] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) {
      setLiveTimer('00:00:00');
      return;
    }

    const updateTimer = () => {
      const dur = calculateLiveDuration(startTime);
      setLiveTimer(dur.formatted);
    };

    // Initial update before interval kicks in
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <Text style={textStyle}>{liveTimer}</Text>;
};

export default React.memo(LiveTimer);
