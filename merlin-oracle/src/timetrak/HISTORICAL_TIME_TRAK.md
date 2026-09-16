# Historical TimeTrak Research Module

This module is a reconstruction harness, not a claim about undocumented Merlin mathematics. Every candidate carries a classification and must preserve its source, evidence, interpretation, mathematical definition, astronomical inputs, implementation, test case, and confidence.

## Classification discipline

- `DOCUMENTED`: explicitly stated by a primary source or by the research protocol. It is not automatically evidence that Merlin used the rule.
- `INFERRED`: a reasoned interpretation from available material. It must remain distinguishable from a quotation or direct record.
- `HYPOTHESIZED`: a falsifiable candidate rule with no confirmation.
- `EXPERIMENTAL`: a control or exploratory implementation created to test the harness.

The current registry has no authenticated historical algorithm. `TimeTrak_V0` is the existing prototype control. The other versions are candidates for comparison only.

## Candidate versions

`historical-time-trak.js` exports four coexisting versions:

- `TimeTrak_V0`: existing deterministic placeholder control.
- `TimeTrak_V1`: fixed cycle-phase candidate; explicitly hypothesized.
- `TimeTrak_HistoricalCandidate_A`: reference-date anniversary candidate; explicitly hypothesized and not authenticated by the name.
- `TimeTrak_Experimental_B`: two-offset convergence experiment; explicitly experimental.

Each runner returns the algorithm ID, status, period, output, and intermediate parameters where applicable. The same reference chart and dataset can be passed to every version.

## Evaluation protocol

The comparison runner requires independent `trainingPeriod` and `testPeriod` values. It reports the same fixture through each selected algorithm twice, with no parameter fitting or tuning step. A training result must not be used to rewrite a candidate before the test result is read.

The bundled `HISTORICAL_RESEARCH_FIXTURE` is intentionally labeled `LOCAL SYNTHETIC FIXTURE`. It is a harness test, not historical market data, and cannot support a historical claim. Replace it with a sourced, immutable dataset before drawing any research conclusion.

## Open evidence ledger

No primary document, quotation, surviving calculation, ephemeris source, orb rule, aspect rule, duration rule, or confidence rule has been attached yet. Those gaps are part of the research record rather than assumptions to fill silently.
