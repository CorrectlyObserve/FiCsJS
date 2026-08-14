import { configRpcClient } from 'ficsjs/router'
import '@/globalCss'

configRpcClient({
  onDeny: ({ redirect }) => {
    if (redirect) window.location.assign(redirect)
  }
})
