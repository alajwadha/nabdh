import {
  kgToLb,
  lbToKg,
  kmToMi,
  miToKm,
  cmToIn,
  cToF,
  mlToOz,
  weightStepKg,
  heightStepCm,
  displayWeight,
  displayWeightPrecise,
  displayHeight,
  displayLength,
  displayDistance,
  displaySpeed,
  displayPace,
  displayTemp,
  displayVolume,
  distanceUnit,
  speedUnit,
} from '../src/services/units';

describe('raw converters', () => {
  it('weight kg<->lb round-trips', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(lbToKg(220)).toBeCloseTo(99.79, 2);
    expect(lbToKg(kgToLb(73.5))).toBeCloseTo(73.5, 6);
  });
  it('distance km<->mi round-trips', () => {
    expect(kmToMi(10)).toBeCloseTo(6.2137, 3);
    expect(miToKm(5)).toBeCloseTo(8.0467, 3);
    expect(miToKm(kmToMi(12.3))).toBeCloseTo(12.3, 6);
  });
  it('length cm->in and temperature C->F', () => {
    expect(cmToIn(175)).toBeCloseTo(68.898, 2);
    expect(cToF(30)).toBe(86);
    expect(cToF(0)).toBe(32);
  });
  it('volume ml->oz', () => {
    expect(mlToOz(1000)).toBeCloseTo(33.814, 2);
  });
});

describe('step sizes', () => {
  it('nudges by one display unit in metric vs imperial', () => {
    expect(weightStepKg('metric')).toBe(1);
    expect(weightStepKg('imperial')).toBeCloseTo(0.4536, 3);
    expect(heightStepCm('metric')).toBe(1);
    expect(heightStepCm('imperial')).toBeCloseTo(2.54, 3);
  });
});

describe('display formatters', () => {
  it('weight whole-number per system', () => {
    expect(displayWeight(80, 'metric')).toEqual({ value: '80', unit: 'kg' });
    expect(displayWeight(80, 'imperial')).toEqual({ value: '176', unit: 'lb' });
  });
  it('weight precise keeps decimals and converts', () => {
    expect(displayWeightPrecise(73.5, 'metric')).toEqual({ value: '73.5', unit: 'kg' });
    expect(displayWeightPrecise(73.5, 'imperial')).toEqual({ value: '162.0', unit: 'lb' });
    expect(displayWeightPrecise(73.456, 'metric', 2)).toEqual({ value: '73.46', unit: 'kg' });
  });
  it('height: cm vs feet-inches with carry', () => {
    expect(displayHeight(175, 'metric')).toEqual({ value: '175', unit: 'cm' });
    expect(displayHeight(175, 'imperial')).toEqual({ value: `5'9"`, unit: '' });
    // 180 cm = 70.87 in -> 5'11"
    expect(displayHeight(180, 'imperial')).toEqual({ value: `5'11"`, unit: '' });
    // 182.9 cm ~ 72.0 in -> carries to 6'0"
    expect(displayHeight(182.9, 'imperial')).toEqual({ value: `6'0"`, unit: '' });
  });
  it('girth length', () => {
    expect(displayLength(90, 'metric')).toEqual({ value: '90', unit: 'cm' });
    expect(displayLength(90, 'imperial')).toEqual({ value: '35', unit: 'in' });
  });
  it('distance two decimals', () => {
    expect(displayDistance(5, 'metric')).toEqual({ value: '5.00', unit: 'km' });
    expect(displayDistance(5, 'imperial')).toEqual({ value: '3.11', unit: 'mi' });
    expect(distanceUnit('imperial')).toBe('MILES');
    expect(speedUnit('imperial')).toBe('MPH');
  });
  it('speed one decimal', () => {
    expect(displaySpeed(10, 'metric')).toBe('10.0');
    expect(displaySpeed(10, 'imperial')).toBe('6.2');
  });
  it('pace converts per-km to per-mi and formats m:ss', () => {
    // 5:00/km -> 8:02/mi (300s * 1.609 = 482.8s -> 8:03 after rounding)
    expect(displayPace(300, 'metric')).toEqual({ value: '5:00', unit: '/km' });
    const imp = displayPace(300, 'imperial');
    expect(imp.unit).toBe('/mi');
    expect(imp.value).toBe('8:03');
  });
  it('pace guards against zero / non-finite', () => {
    expect(displayPace(0, 'metric').value).toBe('--');
    expect(displayPace(Infinity, 'imperial').value).toBe('--');
  });
  it('temperature rounds whole degrees', () => {
    expect(displayTemp(42, 'metric')).toBe('42°');
    expect(displayTemp(42, 'imperial')).toBe('108°'); // 42C = 107.6F -> 108
  });
  it('volume L vs oz', () => {
    expect(displayVolume(2.5, 'metric')).toEqual({ value: '2.5', unit: 'L' });
    expect(displayVolume(2.5, 'imperial')).toEqual({ value: '85', unit: 'oz' });
  });
});
