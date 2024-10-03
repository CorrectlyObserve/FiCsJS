import throwWindowError from './utility'

export default (): Record<string, string> => {
  throwWindowError()

  const queryParams: Record<string, string> = {}
  for (const [key, value] of new URLSearchParams(window.location.search)) queryParams[key] = value

  return queryParams
}
