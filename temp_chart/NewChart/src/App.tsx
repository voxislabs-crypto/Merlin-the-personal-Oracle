import { ChartContainer } from "./components/ChartContainer";
import { sampleChartData } from "./data/chartData";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ChartContainer chartData={sampleChartData} />
    </div>
  );
}

export default App;
