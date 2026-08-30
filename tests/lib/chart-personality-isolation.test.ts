import { calculateBirthChart } from '@/lib/engine';
import { computeMBTIDual } from '@/lib/astrology/mbtiFusion';
import { derivePersonalityFromChart } from '@/lib/personality/dual-overlay';

describe('chart personality isolation', () => {
  it('does not give two different natal charts the same Core/Mask', () => {
    // Voxis · Norfolk VA · 1983-08-14 12:21 EDT = 16:21 UTC
    const norfolk = calculateBirthChart('1983-08-14', '16:21', 36.8468, -76.2855, {
      includePatterns: false,
      includeTransits: false,
    });
    // Friend · Franklin VA · 2005-01-20 unknown time → local noon EST = 17:00 UTC
    const franklin = calculateBirthChart('2005-01-20', '17:00', 36.6776, -76.9225, {
      includePatterns: false,
      includeTransits: false,
    });

    const norfolkDual = computeMBTIDual(norfolk);
    const franklinOff = computeMBTIDual(franklin);
    const franklinOn = computeMBTIDual(franklin, { retrogradeOverlay: true });

    console.log('Norfolk', {
      sun: norfolk.planets.find((p) => p.name === 'Sun')?.sign,
      moon: norfolk.planets.find((p) => p.name === 'Moon')?.sign,
      rising: norfolk.ascendant.sign,
      core: norfolkDual.firmware.type,
      mask: norfolkDual.hardware.type,
    });
    console.log('Franklin noon', {
      sun: franklin.planets.find((p) => p.name === 'Sun')?.sign,
      moon: franklin.planets.find((p) => p.name === 'Moon')?.sign,
      rising: franklin.ascendant.sign,
      rx: franklin.planets.filter((p) => p.retrograde).map((p) => p.name),
      coreOff: franklinOff.firmware.type,
      maskOff: franklinOff.hardware.type,
      coreOn: franklinOn.firmware.type,
      maskOn: franklinOn.hardware.type,
    });

    expect(franklin.ascendant.sign).not.toBe(norfolk.ascendant.sign);
    expect(`${franklinOff.firmware.type}/${franklinOff.hardware.type}`).not.toBe(
      `${norfolkDual.firmware.type}/${norfolkDual.hardware.type}`,
    );
    expect(derivePersonalityFromChart(franklin)?.dualOverlay.firmware.mbtiType).toBe(
      franklinOff.firmware.type,
    );
  });
});
