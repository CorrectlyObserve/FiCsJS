import { configGlobalCss } from 'ficsjs'
import Link from '@/components/Link'
import Tab from '@/pages/websocket-sse/_components/Tab'
import Router from '@/pages/websocket-sse/_components/Router'
import css from '@/.tailwindcss.txt'

configGlobalCss(css)
Link().describe()
Tab.describe()
Router.describe()
