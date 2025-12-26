import { sampleChartData } from '../data/chartData';

export const exportChartData = () => {
  const dataStr = JSON.stringify(sampleChartData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'birthchart-data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getChartDataJSON = () => {
  return JSON.stringify(sampleChartData, null, 2);
};

// Log to console for easy copying
export const logChartData = () => {
  console.log('=== BIRTHCHART DATA ===');
  console.log(getChartDataJSON());
  console.log('=== END BIRTHCHART DATA ===');
};
