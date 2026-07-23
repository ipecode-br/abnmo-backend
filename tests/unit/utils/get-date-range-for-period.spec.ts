import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

describe('getDateRangeForPeriod()', () => {
  it('returns startOfDay to endOfDay for "today"', () => {
    const { startDate, endDate } = getDateRangeForPeriod('today');

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
  });

  it('returns startOfWeek to endOfDay for "last-week"', () => {
    const { startDate, endDate } = getDateRangeForPeriod('last-week');

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
  });

  it('returns startOfMonth to endOfDay for "last-month"', () => {
    const { startDate, endDate } = getDateRangeForPeriod('last-month');

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(startDate.getDate()).toBe(1);
  });

  it('returns startOfYear to endOfDay for "last-year"', () => {
    const { startDate, endDate } = getDateRangeForPeriod('last-year');

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getMonth()).toBe(0);
  });
});
