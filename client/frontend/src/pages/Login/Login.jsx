import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'


function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleLogin = async () => {
        try {
            const res = await axios.post('/api/auth/login', {
                email, 
                password
            });

            localStorage.setItem('token', res.data.token)
            navigate('/home')
        } catch (error) {
            console.error('Login Failed',error)
        }
    } 

    return(
        <div className="p-d-flex p-jc-center p-ai-center" style={{ height: '100vh'}}>
            <div className="card p-shadow-6" style={{ padding: '2rem'}}>
                <h2 className='p-text-center'>Login</h2>
                <div className="p-field">
                    <label>Email</label>
                    <InputText value={email} onChange={(e) => setEmail(e.target.value)} ></InputText>
                </div>

                <div className="p-field">
                    <label>Password</label>
                    <Password value={password} onChange={(e) => setPassword(e.target.value)} ></Password>
                </div>
                <Button label='Login' className='p-mt-3' onClick={handleLogin} ></Button>
            </div>
        </div>
    )
}

export default Login