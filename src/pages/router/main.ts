import { Link, Router } from '../../packages/router/components'
import svg from '../../components/svg'
import getPathParams from '../../packages/router/getPathParams'

const path = '/pages/:router/'

const router = Router({
  pages: [
    {
      path,
      content: ({ $template }) =>
        $template`<p>${getPathParams(path).router}</p>${Link({ href: '/pages/router2/', content: ({ $template }) => $template`bb-aaa${svg}`, router })}`
    },
    {
      path: '/pages/router2/',
      content: ({ $template }) =>
        $template`<p>${getPathParams(path).router2}</p>${Link({ href: path + '3', content: svg, router })}`
    },
    { path: '/pages/router3/', content: () => `<p>Router3</p>`, redirect: path + '4' }
  ],
  notFound: { content: () => `<h1>404 Not Found...</h1>`, redirect: '404' }
})

router.define(document.body)
