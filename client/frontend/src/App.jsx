import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Register from './pages/Register/Register'
import ProctedRoute from './components/ProtectedRouted'
import { BrowserRouter as Router, Routes, Route}  from 'react-router-dom'

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route element={<ProctedRoute/>}>
          <Route path='/home' element={<Home/>}></Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App
