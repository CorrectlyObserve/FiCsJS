import { configGlobalCss, configQueryCache } from 'ficsjs'
import { configRpcClient, showStatus } from 'ficsjs/router'
import globalCss from '@/global'
import Header from '@/pages/Header'

configGlobalCss(globalCss)
configQueryCache()

configRpcClient({
  onDeny: ({ code, redirect }) => (redirect ? window.location.assign(redirect) : showStatus(code))
})

Header.describe()

window.addEventListener('pageshow', ({ persisted }: PageTransitionEvent) => {
  if (persisted) window.location.reload()
})
