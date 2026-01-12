import { configGlobalCss } from 'ficsjs'
import Link from '@/components/Link'
import Users from '@/pages/_components/Users'
import ChatButton from '@/components/ChatButton'
import css from '@/.tailwindcss.txt'

configGlobalCss(css)
Link().describe()
Users.describe()
ChatButton().describe()
