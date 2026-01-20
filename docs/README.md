# Merlin - Personal Oracle

A powerful astrological birth chart calculator and visualization library built with Next.js, TypeScript, and modern web technologies.

## Features

- **Accurate Calculations**: Uses Swiss Ephemeris for precise planetary positions
- **Beautiful Visualizations**: Interactive wheel charts with planetary aspects
- **Modern UI**: Built with Tailwind CSS and Framer Motion animations
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Comprehensive Data**: Planetary positions, houses, aspects, and more

## Installation

```bash
npm install
# or
yarn install
```

## Development

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the application.

> **Note**: The development server runs on port 5000 by default (configured in `package.json`).

## Deployment

### Deploying to Vercel

For complete deployment instructions including environment variable configuration:

👉 **See [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md)** for step-by-step Vercel deployment guide.

Key requirements for successful deployment:
- Configure Clerk authentication environment variables
- Set up Stripe API keys (if using payments)
- Configure application URLs and redirects

The middleware requires Clerk environment variables to be set in Vercel to avoid deployment errors.

## Usage

### Basic Usage

```tsx
import { useBirthChart } from '@/hooks/useBirthChart';

function MyComponent() {
  const { chartData, loading, error, calculateChart } = useBirthChart({
    initialData: {
      date: '1990-01-01',
      time: '12:00',
      latitude: 40.7128,
      longitude: -74.0060,
      houseSystem: 'Placidus',
      zodiac: 'Tropical'
    }
  });

  if (loading) return <div>Loading chart...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Birth Chart</h1>
      {/* Render your chart visualization */}
    </div>
  );
}
```

### Using the AstroDashboard Component

```tsx
import { AstroDashboard } from '@/components/astrology/AstroDashboard';

function ChartPage() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async (birthData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calculate-birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birthData),
      });
      const result = await response.json();
      setChartData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AstroDashboard
      chartData={chartData}
      loading={loading}
      error={error}
      onCalculate={handleCalculate}
      onReset={() => setChartData(null)}
    />
  );
}
```

### Using the Wheel Visualization

```tsx
import { WheelVisualization } from '@/components/astrology/WheelVisualization';

function ChartVisualization({ chartData }) {
  if (!chartData) return null;

  return (
    <WheelVisualization
      planets={chartData.planets}
      houses={chartData.houses}
      aspects={chartData.aspects}
      width={800}
      height={800}
    />
  );
}
```

## API Reference

### useBirthChart Hook

A custom hook that manages birth chart calculations and state.

**Parameters:**
- `initialData?: Partial<BirthData>` - Initial birth data (optional)
- `autoCalculate?: boolean` - Whether to auto-calculate on mount (default: true)
- `onSuccess?: (data: BirthChartData) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

**Returns:**
- `chartData: BirthChartData | null` - Calculated chart data
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `calculateChart: (data: BirthData) => Promise<BirthChartData>` - Manual calculation function
- `BirthChart: React.FC` - Pre-configured BirthChart component
- `reset: () => void` - Reset function

### BirthData Interface

```typescript
interface BirthData {
  date: string;        // YYYY-MM-DD format
  time: string;        // HH:MM format (24h)
  latitude: number;    // Decimal degrees (-90 to 90)
  longitude: number;   // Decimal degrees (-180 to 180)
  houseSystem?: 'Placidus' | 'Koch' | 'Equal' | 'Whole';
  zodiac?: 'Tropical' | 'Sidereal';
}
```

### BirthChartData Interface

```typescript
interface BirthChartData {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: Aspect[];
  angles: {
    ascendant: number;
    midheaven: number;
    descendant: number;
    imumCoeli: number;
  };
  metadata: {
    calculatedAt: string;
    houseSystem: string;
    zodiac: string;
  };
}
```

## Components

### AstroDashboard
Main dashboard component with tabs for chart, planets, aspects, and houses.

### WheelVisualization
Interactive SVG wheel visualization with:
- Planetary positions and glyphs
- House cusps
- Aspect lines with hover effects
- Zodiac signs around the outer ring
- Responsive design

### PlanetInfo
Component for displaying individual planet information with tooltips.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Dependencies

### Core Dependencies
- **Next.js 14**: React framework with app router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **Framer Motion**: Animations
- **Swiss Ephemeris (sweph)**: Astronomical calculations

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Clerk**: Authentication (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Swiss Ephemeris for accurate astronomical calculations
- The astrology community for feedback and inspiration
- Modern web development ecosystem

## Support

If you have any questions or run into issues, please:
1. Check the [documentation](#documentation)
2. Search [existing issues](https://github.com/your-username/merlin/issues)
3. Create a [new issue](https://github.com/your-username/merlin/issues/new)

---

Built with ❤️ for the astrology community
