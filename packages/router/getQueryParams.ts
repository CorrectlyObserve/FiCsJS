export default (): Record<string, string> => {
  if (!window) throw new Error('window is not defined...')

  const queryParams: Record<string, string> = {}
  for (const [key, value] of new URLSearchParams(window.location.search)) queryParams[key] = value

  return queryParams
}
