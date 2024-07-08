import { Child } from './components/child'
import { Parent } from './components/parent'
import GrandParent from './components/grandParent'

const child = Child('Good bye!')
const parent = Parent(child)
const grandParent = GrandParent('green', child, parent)

fetch('https://jsonplaceholder.typicode.com/comments/1')
  .then(response => response.json())
  .then(json => grandParent.setData('email', json.email))

grandParent.ssr('app')

Child().define(document.body)
grandParent.define()
