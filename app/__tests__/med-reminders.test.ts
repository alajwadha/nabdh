import { parseTime, buildMedReminder, ID_MED, type MedReminderInput } from '../src/services/notifications';

describe('parseTime', () => {
  it('parses HH:MM', () => {
    expect(parseTime('09:30')).toEqual({ hour: 9, minute: 30 });
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
  });
  it('clamps out-of-range and falls back on garbage', () => {
    expect(parseTime('99:99')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('')).toEqual({ hour: 9, minute: 0 });
    expect(parseTime('not a time')).toEqual({ hour: 9, minute: 0 });
  });
});

describe('buildMedReminder', () => {
  const base: MedReminderInput = { id: 'm1', name: 'Vitamin D', reminderOn: true, reminderTime: '08:15' };

  it('returns null when the reminder is off or has no time', () => {
    expect(buildMedReminder({ ...base, reminderOn: false })).toBeNull();
    expect(buildMedReminder({ ...base, reminderTime: undefined })).toBeNull();
    expect(buildMedReminder({ id: 'm2', name: 'Iron' })).toBeNull();
  });

  it('builds a daily payload with a stable, collision-free identifier', () => {
    const r = buildMedReminder(base);
    expect(r).not.toBeNull();
    expect(r!.identifier).toBe(ID_MED('m1'));
    expect(r!.identifier.startsWith('med-')).toBe(true);
    expect(r!.hour).toBe(8);
    expect(r!.minute).toBe(15);
    expect(r!.title).toBe('Medication reminder');
    expect(r!.body).toBe('Time to take Vitamin D.');
  });

  it('includes the dose in the body when present', () => {
    const r = buildMedReminder({ ...base, dose: '1000 IU' });
    expect(r!.body).toBe('Time to take Vitamin D (1000 IU).');
  });

  it('med identifiers never collide with reminder/hydration prefixes', () => {
    const id = ID_MED('weigh_in'); // even if a med id shadowed a reminder key
    expect(id.startsWith('rem-')).toBe(false);
    expect(id.startsWith('hyd-')).toBe(false);
    expect(id).toBe('med-weigh_in');
  });
});
