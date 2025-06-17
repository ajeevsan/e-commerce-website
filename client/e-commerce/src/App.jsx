import Home from "./pages/home/Home"
import Login from "./pages/login/Login"
import './App.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom"


const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>
  },
  {
    path: 'login',
    element: <Login />
  },
])

const App = () => {
  return (
    <RouterProvider router={router}></RouterProvider>
  )
} 

export default App