export function getPageCount(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export function getLastPageIndex(
  totalCount: number,
  pageSize: number,
): number {
  return getPageCount(totalCount, pageSize) - 1;
}
