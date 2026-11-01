import { fics, type FiCs } from 'ficsjs'
import { cssVar, flex, space } from 'ficsjs/style'

interface Props {
  activities: readonly string[]
}

const html: FiCs.Html<{}, Props> = ({ props: { activities }, template }) => template`
  <section>
    <h3>Activities</h3>
    <div>${activities.map((activity, index) => template`<p key="${index}">${activity}</p>`)}</div>
  </section>
`

const css: FiCs.Css<{}, Props> = `div { ${flex({ direction: 'column', gap: space('md') })} }`

export default fics<{}, Props>({ name: 'activities', html, css })
