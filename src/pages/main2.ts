import getPathParams from '../packages/router/getPathParams'
import Link from '../packages/router/linkComponent'
import Router from '../packages/router/routerComponent'
import svg from '../components/svg'

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
        $template`<p>${getPathParams(path).router2}</p>${Link({ href: path + '3', content: () => svg, router })}`
    },
    {
      path: '/pages/router3/',
      content: ({ $template }) => $template`<p>Router3</p>`,
      redirect: path + '4'
    }
  ],
  notFound: { content: ({ $template }) => $template`<h1>404 Not Found...</h1>` }
})

router.define(document.body)
