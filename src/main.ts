import GrandParent from './grandParent'
import { Parent } from './parent'
import { Child } from './child'

const child = Child('Good bye!')
const parent = Parent(child)
const grandParent = GrandParent('green', child, parent)

fetch('https://jsonplaceholder.typicode.com/comments/1')
  .then(response => response.json())
  .then(json => grandParent.setData('email', json.email))

console.log(grandParent.ssr())

grandParent.define()
