export type DbRow = {
  id: number,
  eventdate: Date,
  trackname: string
};

export type DbError = {
  message: string,
  fatal: boolean
}

export type DbRowResponse = {
  rows: DbRow[],
  error: DbError | null
}
