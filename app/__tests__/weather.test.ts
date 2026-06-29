import { placeLabel, RIYADH } from '../src/services/weather';

describe('weather.placeLabel', () => {
  test('prefers city, then subregion, then region, then name', () => {
    expect(placeLabel({ city: 'Jeddah', region: 'Makkah' })).toBe('Jeddah');
    expect(placeLabel({ city: null, subregion: 'Al Olaya', region: 'Riyadh' })).toBe('Al Olaya');
    expect(placeLabel({ city: null, subregion: null, region: 'Eastern Province' })).toBe('Eastern Province');
    expect(placeLabel({ name: 'Some Place' })).toBe('Some Place');
  });
  test('empty / null inputs return empty string', () => {
    expect(placeLabel(null)).toBe('');
    expect(placeLabel(undefined)).toBe('');
    expect(placeLabel({})).toBe('');
    expect(placeLabel({ city: '   ' })).toBe('');
  });
  test('RIYADH default is sane', () => {
    expect(RIYADH.name).toBe('Riyadh');
    expect(Math.round(RIYADH.lat)).toBe(25);
  });
});
