import GrandParent from './grandParent'

const grandParent = GrandParent('green')

console.log(grandParent.ssr())

grandParent.define()

fetch('https://jsonplaceholder.typicode.com/comments/1')
  .then(response => response.json())
  .then(json => grandParent.setData('email', json.email))
