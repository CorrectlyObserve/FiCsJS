import { ficsCss } from 'ficsjs'
import Link from '@/components/Link'
import Tab from '@/components/websocket-sse/Tab'
import Router from '@/components/websocket-sse/Router'
import css from '@/.tailwindcss.txt'

ficsCss(css)
Link().describe()
Tab.describe()
Router.describe()
