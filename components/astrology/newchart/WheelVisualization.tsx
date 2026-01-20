import React from 'react';
import type { WheelVisualizationProps } from '@/types/chart';

// Stub WheelVisualization component
export const WheelVisualization: React.FC<WheelVisualizationProps> = (props) => {
  return (
    <div style={{ border: '1px dashed #ccc', padding: 24, textAlign: 'center' }}>
      <strong>WheelVisualization Stub</strong>
      <pre style={{ fontSize: 12, marginTop: 12 }}>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
};
