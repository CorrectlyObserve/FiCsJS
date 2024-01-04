import Header from '../components/header'
import { TodoInput } from '../components/todoInput'
import { Svg } from '../components/svg'
import { TodoList } from '../components/todoList'
import Footer from '../components/footer'

Header().define()
TodoInput(Svg()).define()
TodoList().define()
Footer().define()
