import Header from './components/header'
import TodoApp from './components/app'
import { TodoTitle } from './components/title'
import { TodoPost } from './components/post'
import { TodoList } from './components/list'
import Footer from './components/footer'
import css from './styles/todo.css?inline'

Header(css).define()
TodoApp(TodoTitle(), TodoPost(), TodoList()).define()
Footer(css).define()
