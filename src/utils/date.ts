export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STUDY_DAY_START_HOUR = 5;
const STUDY_DAY_OFFSET_MS = STUDY_DAY_START_HOUR * 60 * 60 * 1000;

export function formatStudyDate(date: Date): string {
  return formatLocalDate(new Date(date.getTime() - STUDY_DAY_OFFSET_MS));
}
