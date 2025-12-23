import { configGlobalCss } from 'ficsjs'
import Link from '@/components/Link'
import Photos from '@/pages/scroll/_components/Photos'
import ChatButton from '@/components/ChatButton'
import css from '@/.tailwindcss.txt'

configGlobalCss(css)
Link().describe()
Photos.describe()
ChatButton().describe()
