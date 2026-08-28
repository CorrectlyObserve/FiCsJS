import { configRpcClient, showStatus } from 'ficsjs/router'
import '@/globalCss'

configRpcClient({
  onDeny: ({ code, redirect }) => (redirect ? window.location.assign(redirect) : showStatus(code))
})

window.addEventListener('pageshow', ({ persisted }: PageTransitionEvent) => {
  if (persisted) window.location.reload()
})
