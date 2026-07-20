import { configQueryCache } from 'ficsjs'
import '@/globalCss'
import ChatButton from '@/components/ChatButton'
import Link from '@/components/Link'
import Photos from '@/pages/scroll/Photos'

configQueryCache()
Link.describe()
Photos.describe()
ChatButton.describe()
