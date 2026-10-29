import { fics, type FiCs } from 'ficsjs'
import { fade } from 'ficsjs/animation'
import {
  color,
  fill,
  gradient,
  layout,
  motion,
  oklch,
  radius,
  size,
  space,
  stroke,
  tapSize,
  textSize
} from 'ficsjs/style'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import Link from '@/components/Link'
import { pages, paths } from '@/domain/path'
import type { Theme } from '@/domain/theme'
import { getTheme, setTheme } from '@/pages/store'
import { Menu, Moon, Sun, SunMoon } from 'lucide-static'

interface Data {
  readonly title: string
  readonly hasLoggedIn: boolean
  theme: Theme | null
  isMenuOpened: boolean
}

const props: FiCs.Props<Data, {}> = {
  descendants: ({ children: { button } }) => button,
  values: () => ({ isFull: true })
}

const MENU = [pages.USERS, pages.ACCOUNT, pages.WS_SSE, pages.SCROLL] as const
const FORMS = [
  {
    id: 'logout',
    action: paths.LOGOUT,
    text: 'Log out',
    description: 'Clears the session and redirects to login.'
  },
  {
    id: 'break-session',
    action: paths.BREAK_SESSION,
    text: 'Break this session',
    description: 'Simulates a deleted account to trigger a 401 error.'
  }
] as const

const html: FiCs.Html<Data, {}> = ({
  data,
  children: { link, icon, button },
  template,
  attributes: { show }
}) => {
  const isDark = data.theme === 'dark'

  return template`
    <header>
      ${icon.setIndividualProps('theme', {
        svg: data.theme === null ? SunMoon : isDark ? Sun : Moon,
        ariaLabel: `Switch to ${isDark ? 'light' : 'dark'} mode`,
        click: () => {
          data.theme = isDark ? 'light' : 'dark'
          setTheme(data.theme)
        }
      })}
      <h1>${data.title}</h1>
      ${
        data.hasLoggedIn &&
        template`
          ${icon.setIndividualProps('menu', {
            svg: Menu,
            ariaLabel: 'Menu',
            click: () => (data.isMenuOpened = !data.isMenuOpened)
          })}
          <div ${show(data.isMenuOpened)}></div>
          <nav ${show(data.isMenuOpened)} aria-label="Pages">
            <ul role="list">
              ${MENU.map(
                ({ href, name }) => template`
                  <li key="${href}">${link.setIndividualProps(href, { href, text: name })}</li>
                `
              )}
            </ul>
            <hr />
            ${FORMS.map(
              ({ id, action, text, description }) => template`
                <form method="post" action="${action}" key="${id}">
                  ${button.setIndividualProps(id, { label: text, type: 'submit', tooltip: description })}
                </form>
              `
            )}
          </nav>
        `
      }
    </header>
  `
}

const css: FiCs.Css<Data, {}> = `
  header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: ${space('sm')};
    padding-block: ${space('sm')};

    h1 {
      ${fill(gradient([[oklch('#d14344'), '30%'], oklch('#cb0078')], { deg: 30 }))};
      ${textSize('2xl')};
      background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;

      @media (forced-colors: active) {
        background: none;
        color: CanvasText;
      }

      + * { justify-self: end; }
    }

    div {
      position: fixed;
      inset: 0;
      z-index: 10;
    }

    nav {
      ${fade(motion())};
      ${fill('bg-raised')};
      ${radius('lg')};
      position: absolute;
      top: calc(${tapSize()} + ${space('sm')} * 2);
      right: ${space('lg')};
      padding: ${space('md')};
      border: ${stroke('sm')} solid ${color('border')};
      box-shadow: ${size(1)} ${size(1)} ${size(3)} ${color('shadow')};
      z-index: 20;

      @container ${layout('compact')} { right: ${space('md')}; }

      > ul {
        list-style: none;

        li {
          ${textSize('md', true)};
          margin-block-end: ${space('sm')};

          &:last-child { margin-block-end: 0; }
        }
      }

      hr {
        width: 100%; 
        border: none;
        border-top: ${stroke('sm')} solid ${color('divider')};
        margin-block: ${space('md')};
      }

      form {
        margin-block-end: ${space('sm')};

        &:last-child { margin-block-end: 0; }
      }
    }
  }
`

const hooks: FiCs.Hooks<Data, {}> = { created: ({ data }) => (data.theme = getTheme()) }

const actions: FiCs.Actions<Data, {}> = {
  div: { click: ({ data }) => (data.isMenuOpened = false) }
}

export default fics<Data, {}>({
  name: 'header',
  children: [Link(), Icon(), Button()],
  data: () => ({ title: 'FiCsJS on Bun', hasLoggedIn: false, theme: null, isMenuOpened: false }),
  props,
  html,
  css,
  hooks,
  actions
})
