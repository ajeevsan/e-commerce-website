import Home from "./pages/home/Home"
import Login from "./pages/login/Login"
import './App.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoutes";

const isAuthenticated = !!localStorage.getItem('token')

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute isAuthenticated={isAuthenticated}>
      <Home/>
    </ProtectedRoute>
  },
  {
    path: 'login',
    element: <Login />
  },
  {
    path: "*",
    element: <Login />,
  },
])

const App = () => {
  return (
    <RouterProvider router={router}></RouterProvider>
  )
} 

export default App