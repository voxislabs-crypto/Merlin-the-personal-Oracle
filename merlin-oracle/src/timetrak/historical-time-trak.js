import { calculatePlaceholderTimeTrak } from './engine.js';

export const RESEARCH_STATUSES = ['DOCUMENTED', 'INFERRED', 'HYPOTHESIZED', 'EXPERIMENTAL'];

export const HISTORICAL_TIME_TRAK_COMPONENTS = [
  {
    id: 'training-test-separation',
    status: 'DOCUMENTED',
    confidence: 'Required protocol',
    source: 'Historical Merlin reconstruction specification for this project.',
    historicalEvidence: 'This documents the present research protocol, not historical Merlin usage.',
    interpretation: 'A candidate must be evaluated on a held-out period that was not used to tune it.',
    mathematicalDefinition: 'Partition dataset rows by date into disjoint TRAINING and TEST intervals.',
    requiredAstronomicalInputs: ['Event date', 'Training start/end', 'Test start/end'],
    implementation: 'runHistoricalComparison returns separate rows for each split and archives both periods.',
    testCase: 'Confirm the same algorithm ID appears once in each split and no event belongs to both.',
  },
  {
    id: 'reference-chart-anchor',
    status: 'INFERRED',
    confidence: 'Unverified',
    source: 'Existing prototype data model and the phrase "relative to a reference chart" in the project brief.',
    historicalEvidence: 'No primary historical document has been supplied to confirm how a reference chart was used.',
    interpretation: 'Candidate algorithms accept a reference chart as an explicit input rather than hiding the anchor.',
    mathematicalDefinition: 'Each algorithm is a function f(referenceChart, analysisPeriod) -> time window and metadata.',
    requiredAstronomicalInputs: ['Reference date/time', 'Location', 'Coordinates', 'Time zone when available'],
    implementation: 'runHistoricalAlgorithm requires chart and period arguments and returns the selected version ID.',
    testCase: 'Run identical periods with two charts and verify outputs carry different chart-derived parameters where the rule uses them.',
  },
  {
    id: 'candidate-window-rule',
    status: 'HYPOTHESIZED',
    confidence: 'Low until sourced',
    source: 'Candidate design only; no historical citation.',
    historicalEvidence: 'None recorded.',
    interpretation: 'A proposed rule is a testable object, never an undocumented fact.',
    mathematicalDefinition: 'A candidate must state start, peak, end, intensity, and every constant used to derive them.',
    requiredAstronomicalInputs: ['Inputs declared by the candidate version'],
    implementation: 'Each version returns intermediate parameters in output.parameters when it has derived values.',
    testCase: 'Serialize the full result twice and compare all fields, including parameters and version ID.',
  },
  {
    id: 'synthetic-fixture-control',
    status: 'EXPERIMENTAL',
    confidence: 'Harness-only',
    source: 'Generated local fixture included with this prototype.',
    historicalEvidence: 'None; the fixture is explicitly not historical evidence.',
    interpretation: 'A small deterministic fixture tests comparison plumbing before sourced data is introduced.',
    mathematicalDefinition: 'Rows are assigned fixed ISO dates and magnitudes; no market or astronomical claim is attached.',
    requiredAstronomicalInputs: ['None beyond the selected reference chart for the candidate runner'],
    implementation: 'HISTORICAL_RESEARCH_FIXTURE in this module.',
    testCase: 'Run all versions against the fixture and preserve training/test outputs without optimization.',
  },
];

export const HISTORICAL_TIME_TRAK_ALGORITHMS = [
  {
    id: 'TimeTrak_V0',
    status: 'EXPERIMENTAL',
    confidence: 'Baseline only',
    source: 'Merlin Oracle prototype, local implementation; not a historical source.',
    historicalEvidence: 'None. This is the existing deterministic placeholder and must not be treated as recovered Merlin methodology.',
    interpretation: 'A reproducible control implementation for checking the research harness.',
    mathematicalDefinition: 'offset = (length(chart.name) + latitude) mod 5; start = chart.date + round(offset); duration = 2 + round(offset).',
    requiredAstronomicalInputs: ['Reference date', 'Reference latitude', 'Reference longitude', 'Reference name'],
    implementation: 'calculatePlaceholderTimeTrak(chart) from the original prototype engine.',
    testCase: 'Run the same chart and period twice; the serialized output must be identical.',
  },
  {
    id: 'TimeTrak_V1',
    status: 'HYPOTHESIZED',
    confidence: 'Low',
    source: 'No historical source supplied. Candidate created only to test the research infrastructure.',
    historicalEvidence: 'None recorded. The cycle length below is a modern experimental assumption, not a Merlin fact.',
    interpretation: 'A phase-window candidate using a fixed synodic-style period as a transparent control.',
    mathematicalDefinition: 'phase = dayOfYear(referenceDate) mod 29.53; center = periodStart + round(phase); window = center +/- 1 day; intensity = 100 - abs(phase - 14.765) * 4.',
    requiredAstronomicalInputs: ['Reference date', 'Analysis period start', 'Analysis period end'],
    implementation: 'Pure date arithmetic in runTimeTrakV1; no ephemeris is consulted.',
    testCase: 'Use a leap-year date and a non-leap-year date; verify the period is explicit and no timezone drift changes the date.',
  },
  {
    id: 'TimeTrak_HistoricalCandidate_A',
    status: 'HYPOTHESIZED',
    confidence: 'Unrated until sourced',
    source: 'Research placeholder. No primary document, quotation, table, or surviving calculation has been attached.',
    historicalEvidence: 'None. The name identifies a candidate slot, not historical authentication.',
    interpretation: 'A candidate based on a reference-date anniversary and a narrow temporal window; useful only as a falsifiable hypothesis.',
    mathematicalDefinition: 'anniversary = periodStart + ((dayOfYear(referenceDate) - dayOfYear(periodStart)) mod 365); window = anniversary +/- 2 days; intensity = 70 + (year mod 7).',
    requiredAstronomicalInputs: ['Reference date', 'Analysis period start', 'Analysis period end'],
    implementation: 'Pure date arithmetic in runTimeTrakHistoricalCandidateA; leap-day handling is documented in source.',
    testCase: 'Compare a chart whose reference date is February 29 against a March 1 reference and inspect the explicit leap-day rule.',
  },
  {
    id: 'TimeTrak_Experimental_B',
    status: 'EXPERIMENTAL',
    confidence: 'Low / exploratory',
    source: 'New experiment design for this reconstruction project; not historical evidence.',
    historicalEvidence: 'None. This candidate intentionally demonstrates how a multi-signal rule can be compared without claiming origin.',
    interpretation: 'A deliberately simple convergence candidate that combines two transparent anniversary offsets.',
    mathematicalDefinition: 'a = periodStart + dayOfYear(referenceDate) mod 180; b = periodStart + (dayOfYear(referenceDate) * 2) mod 180; window = min(a,b) through max(a,b), capped to period; intensity = 50 + window length.',
    requiredAstronomicalInputs: ['Reference date', 'Analysis period start', 'Analysis period end'],
    implementation: 'Pure date arithmetic in runTimeTrakExperimentalB; all intermediate dates are returned for audit.',
    testCase: 'Run on training and test periods with the same chart; verify the rule and parameters are unchanged between splits.',
  },
];

export const HISTORICAL_RESEARCH_FIXTURE = {
  id: 'fixture-local-synthetic-01',
  label: 'LOCAL SYNTHETIC FIXTURE',
  source: 'Generated in-app test rows. Not historical market data and not evidence for Merlin.',
  events: [
    { id: 'fixture-01', date: '2021-02-14', label: 'Fixture event A', magnitude: 2.1 },
    { id: 'fixture-02', date: '2021-04-09', label: 'Fixture event B', magnitude: 3.8 },
    { id: 'fixture-03', date: '2021-07-18', label: 'Fixture event C', magnitude: 1.4 },
    { id: 'fixture-04', date: '2021-10-31', label: 'Fixture event D', magnitude: 4.6 },
    { id: 'fixture-05', date: '2022-02-14', label: 'Fixture event E', magnitude: 2.7 },
    { id: 'fixture-06', date: '2022-05-22', label: 'Fixture event F', magnitude: 5.1 },
    { id: 'fixture-07', date: '2022-08-19', label: 'Fixture event G', magnitude: 1.8 },
    { id: 'fixture-08', date: '2022-11-11', label: 'Fixture event H', magnitude: 3.2 },
  ],
};

function parseDate(value) { return new Date(`${value}T12:00:00Z`); }
function toDate(value) { return value.toISOString().slice(0, 10); }
function addDays(value, days) { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + days); return toDate(date); }
function dayOfYear(value) { const date = parseDate(value); const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0); return Math.floor((date.getTime() - yearStart) / 86400000); }
function clampDate(value, start, end) { return value < start ? start : value > end ? end : value; }
function normalizeWindow(start, end, periodStart, periodEnd) { return { start: clampDate(start, periodStart, periodEnd), end: clampDate(end, periodStart, periodEnd), peak: clampDate(addDays(start, Math.floor((parseDate(end) - parseDate(start)) / 172800000)), periodStart, periodEnd) }; }

function runTimeTrakV1(chart, period) {
  const phase = dayOfYear(chart.date) % 29.53;
  const centerOffset = Math.round(phase);
  const center = addDays(period.start, centerOffset);
  const window = normalizeWindow(addDays(center, -1), addDays(center, 1), period.start, period.end);
  return { ...window, duration: '3 days', intensity: Math.max(1, Math.round(100 - Math.abs(phase - 14.765) * 4)), object: 'Cycle phase', aspect: 'Phase window', orb: 0, direction: 'Unknown', quality: 'Candidate', parameters: { cycleDays: 29.53, phase: Number(phase.toFixed(3)) } };
}

function runTimeTrakHistoricalCandidateA(chart, period) {
  const anniversaryOffset = ((dayOfYear(chart.date) - dayOfYear(period.start)) % 365 + 365) % 365;
  const center = addDays(period.start, anniversaryOffset);
  const window = normalizeWindow(addDays(center, -2), addDays(center, 2), period.start, period.end);
  return { ...window, duration: '5 days', intensity: 70 + (parseDate(period.start).getUTCFullYear() % 7), object: 'Reference anniversary', aspect: 'Anniversary', orb: 0, direction: 'Unknown', quality: 'Candidate', parameters: { anniversaryOffset, leapDayRule: 'day-of-year modulo 365' } };
}

function runTimeTrakExperimentalB(chart, period) {
  const first = addDays(period.start, dayOfYear(chart.date) % 180);
  const second = addDays(period.start, (dayOfYear(chart.date) * 2) % 180);
  const rawStart = first < second ? first : second;
  const rawEnd = first < second ? second : first;
  const window = normalizeWindow(rawStart, rawEnd, period.start, period.end);
  const duration = Math.max(1, Math.round((parseDate(window.end) - parseDate(window.start)) / 86400000) + 1);
  return { ...window, duration: `${duration} days`, intensity: Math.min(100, 50 + duration), object: 'Dual offset', aspect: 'Convergence candidate', orb: 0, direction: 'Unknown', quality: 'Experimental', parameters: { firstOffset: dayOfYear(chart.date) % 180, secondOffset: (dayOfYear(chart.date) * 2) % 180 } };
}

export function runHistoricalAlgorithm(algorithmId, chart, period) {
  const algorithm = HISTORICAL_TIME_TRAK_ALGORITHMS.find((candidate) => candidate.id === algorithmId);
  if (!algorithm) throw new Error(`Unknown Historical TimeTrak algorithm: ${algorithmId}`);
  const output = algorithmId === 'TimeTrak_V0'
    ? calculatePlaceholderTimeTrak(chart)
    : algorithmId === 'TimeTrak_V1'
      ? runTimeTrakV1(chart, period)
      : algorithmId === 'TimeTrak_HistoricalCandidate_A'
        ? runTimeTrakHistoricalCandidateA(chart, period)
        : runTimeTrakExperimentalB(chart, period);
  return { algorithmId, status: algorithm.status, version: algorithmId, period, output };
}

function eventsInWindow(events, output) { return events.filter((event) => event.date >= output.start && event.date <= output.end); }
export function runHistoricalComparison({ chart, dataset = HISTORICAL_RESEARCH_FIXTURE.events, trainingPeriod, testPeriod, algorithmIds = HISTORICAL_TIME_TRAK_ALGORITHMS.map((algorithm) => algorithm.id) }) {
  const runSplit = (split, period) => algorithmIds.map((algorithmId) => {
    const run = runHistoricalAlgorithm(algorithmId, chart, period);
    const inside = eventsInWindow(dataset.filter((event) => event.date >= period.start && event.date <= period.end), run.output);
    const outside = dataset.filter((event) => event.date >= period.start && event.date <= period.end && !inside.includes(event));
    return { ...run, split, eventsInside: inside, eventsOutside: outside, eventCount: inside.length + outside.length };
  });
  return { fixture: { id: HISTORICAL_RESEARCH_FIXTURE.id, label: HISTORICAL_RESEARCH_FIXTURE.label, source: HISTORICAL_RESEARCH_FIXTURE.source }, trainingPeriod, testPeriod, algorithms: [...runSplit('TRAINING', trainingPeriod), ...runSplit('TEST', testPeriod)] };
}
