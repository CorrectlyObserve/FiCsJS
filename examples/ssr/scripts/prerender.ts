import { createQueryCache } from 'ficsjs'
import { prerender } from 'ficsjs/router/server-only'
import { render } from '@/server/render'
import { pages } from '@fics/routing/server'

const origin: string | undefined = process.env.ORIGIN

await prerender(pages, {
  render,
  createContext: () => ({ queryCache: createQueryCache() }),
  outDir: 'dist',
  viewTransition: true,
  ...(origin ? { origin, sitemap: true } : {})
})
