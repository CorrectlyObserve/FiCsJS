import { fics, type FiCs } from 'ficsjs'
import { cssVar, oklch, size, textSize } from 'ficsjs/style'
import Link from '@/components/Link'
import Button from '@/components/Button'
import { BREAK_SESSION_PATH, LOGOUT_PATH, USERS_PATH } from '@/domain/path'
import { type Role } from '@/domain/role'
import { black } from '@/utils/color'

interface Data {
  name: string
  role: Role
}

const props: FiCs.Props<Data, {}> = {
  descendants: ({ children: { link } }) => link,
  values: () => ({ href: USERS_PATH, text: 'Go to the user list \u2192' })
}

const forms = [
  {
    action: LOGOUT_PATH,
    text: 'Log out',
    description: 'Clears the session and redirects to login.'
  },
  {
    action: BREAK_SESSION_PATH,
    text: 'Break this session',
    description: 'Simulates a deleted account to trigger a 401 error.'
  }
] as const

const html: FiCs.Html<Data, {}> = ({
  children: { link, button },
  data: { name, role },
  template
}) => template`
    <p class="title">Signed in as <b>${name}</b> <span class="badge ${role}">${role}</span></p>
    ${link}
    <ul>
      <li>Read: Requires a session (users/+middleware.ts).</li>
      <li>Write: Requires the admin role (users/new/+middleware.ts returns 403).</li>
    </ul>
    <hr>
    ${forms.map(
      ({ action, text, description }, index) => template`
        <form method="post" action="${action}" style="anchor-name: --form-${index}">
          ${button.setIndividualProps(index, { text })}
          <p popover style="position-anchor: --form-${index}" align="center">${description}</p>
        </form>
      `
    )}
`

const css: FiCs.Css<Data, {}> = `
  :host { 
    display: grid;
    justify-items: center;
    gap: ${size(4)};

    ul {
      list-style: none;
      padding-inline-start: 0;

      li {
        ${textSize('base')}
        position: relative;
        padding-inline-start: ${size(3)}; 

        &::before {
          content: "•";
          position: absolute;
          left: 0;
        }
      }
    }
    
    hr { width: 100%; border-width: 0.5px; margin-block: ${size(4)}; }
  
    form { 
      display: grid; justify-items: center;
      
      p[popover] {
        inset: auto;
        position-area: block-start;
        max-inline-size: 60ch;
        background: ${oklch(black, { darker: 0.05 })};
        padding: ${size(2)};
        margin-block-end: ${size(1)};
        border: 1px solid #fff;
        border-radius: ${size(2)};
        transition: ${cssVar('--transition')};
      }
    }
  }
`

const toggle =
  (isOpen: boolean) =>
  ({ event: { currentTarget } }: { event: Event }): void => {
    ;(currentTarget as Element)
      .closest('form')
      ?.querySelector<HTMLElement>('[popover]')
      ?.togglePopover(isOpen)
  }

const actions: FiCs.Actions<Data, {}> = {
  '.button': { mouseenter: toggle(true) },
  form: { mouseleave: toggle(false), focusin: toggle(true), focusout: toggle(false) }
}

export default fics<Data, {}>({
  name: 'top',
  children: [Link(), Button()],
  data: () => ({ name: '', role: 'member' }),
  props,
  html,
  css,
  actions
})
