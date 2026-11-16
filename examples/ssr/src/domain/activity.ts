export const toActivity = (text: string): string =>
  `${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC: ${text}`
