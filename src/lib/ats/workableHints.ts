/** Workable widget (apply.workable.com/shortname) can be empty while jobs.workable.com/company/{id}/… lists roles. */
export const WORKABLE_USE_JOBS_BOARD_URL =
  "For Workable, paste the jobs.workable.com/company/… link (the one with the long id in the path, e.g. from “Jobs by Workable”). Short apply.workable.com/company-name links often show zero roles even when the board has openings.";

export function isApplyWorkableHost(url: string): boolean {
  return /apply\.workable\.com/i.test(url.trim());
}
