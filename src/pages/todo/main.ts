import Header from '../../components/header'
import TodoApp from '../../components/todoApp'
import { TodoTitle } from '../../components/todoTitle'
import { TodoPost } from '../../components/todoPost'
import { TodoList } from '../../components/todoList'
import Footer from '../../components/footer'
import css from '../../styles/todo.css?inline'

Header(css).define()
TodoApp(TodoTitle(), TodoPost(), TodoList()).define()
Footer(css).define()
