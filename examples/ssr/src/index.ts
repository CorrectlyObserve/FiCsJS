import { ficsCss } from 'ficsjs'
import Link from '@/components/Link'
import Users from '@/components/index/Users'
import ChatButton from '@/components/ChatButton'
import css from '@/.tailwindcss.txt'

ficsCss(css)
Link().describe()
Users.describe()
ChatButton().describe()
