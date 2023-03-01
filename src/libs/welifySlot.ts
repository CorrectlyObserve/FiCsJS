import { welySlotArgs } from './types'
import { getChildNodes } from './utils'
import { WelyElement } from './wely'

export const welySlot = ({ slotId, content, css }: welySlotArgs): void => {
  customElements.define(
    'w-slot',
    class extends WelyElement {
      slotId?: string
      content: string

      constructor() {
        super()
        this.name = 'slot'
        this.slotId = slotId
        this.content = content || ''
        this.css = css
      }

      connectedCallback(): void {
        const childNodes: ChildNode[] = getChildNodes(content || '')

        console.log(this.welyId)

        if (childNodes.length > 0) {
          this.html = () =>
            `<slot ${this.slotId ? `name="${this.slotId}" ` : ''} />`

          const slotContent = <HTMLElement>childNodes[0]

          if (this.slotId) slotContent.setAttribute('slot', this.slotId)

          this.appendChild(slotContent)
        }

        super.connectedCallback()
      }
    }
  )
}
