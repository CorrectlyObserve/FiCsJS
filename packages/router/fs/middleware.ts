export const getAllMiddlewares = (
  dirs: string[],
  middlewareFiles: Map<string, string>
): string[] => {
  const chain: string[] = []

  for (let i = 0; i <= dirs.length; i++) {
    const current: string = dirs.slice(0, i).join('/'),
      mw: string | undefined = middlewareFiles.get(current)

    if (mw) chain.push(mw)
  }

  return chain
}
