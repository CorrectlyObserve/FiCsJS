export const getAllMiddlewares = ({
  dirs,
  mws,
  reverse
}: {
  dirs: string[]
  mws: Map<string, string>
  reverse?: boolean
}): string[] => {
  const chain: string[] = []

  for (let i = 0; i <= dirs.length; i++) {
    const current: string = dirs.slice(0, i).join('/'),
      mw: string | undefined = mws.get(current)

    if (mw) chain.push(mw)
  }

  return reverse ? chain.reverse() : chain
}
