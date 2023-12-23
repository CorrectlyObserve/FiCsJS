import { Child } from './child'
import { Parent } from './parent'
import GrandParent from './grandParent'

const child = Child('Good bye!')
const parent = Parent(child)
const grandParent = GrandParent('green', child, parent)

fetch('https://jsonplaceholder.typicode.com/comments/1')
  .then(response => response.json())
  .then(json => grandParent.setData('email', json.email))

console.log(grandParent.ssr())

child.define()
grandParent.define()
