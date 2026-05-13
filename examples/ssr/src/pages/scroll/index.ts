import { configQueryCache } from 'ficsjs'
import '@/globalCss'
import Link from '@/components/Link'
import Photos from '@/pages/scroll/_components/Photos'
import ChatButton from '@/components/ChatButton'

configQueryCache()
Link().describe()
Photos.describe()
ChatButton().describe()
