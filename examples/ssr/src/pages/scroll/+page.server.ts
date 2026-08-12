import ChatButton from '@/components/ChatButton'
import Link from '@/components/Link'
import Photos from '@/pages/scroll/Photos'

export const meta = {
  title: 'Infinite and virtual scroll',
  description: 'This is a simple example of an infinite scroll and a virtual scroll with FiCsJS.'
}

export default (): string => `
  ${Link.toString()}
  ${Photos.toString()}
  ${ChatButton.toString()}
`
