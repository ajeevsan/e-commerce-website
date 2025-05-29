import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../api/authApi'
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';



function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const toast = useRef(null);

    const handleLogin = async () => {
        try {
            console.log("email_password____", email, password);

            const res = await loginUser({ email, password })

            console.log("res____", res)

            localStorage.setItem('token', res.token)
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Successfully Login !!!' });

            //! Navigating to the Login Page 
            setTimeout(() => {
                navigate('/home')
            },2000)
        } catch (error) {
            console.error('Login Failed', error)
        }
    }

    const footer = (
        <div className='flex justify-content-center'>
            <Button label="Login" onClick={handleLogin} />
        </div>
    );

    return (
        <div className='flex justify-content-center align-items-center h-screen'>
            <Toast ref={toast} />
            <Card title="Login" footer={footer} className="md:w-25rem ">
                <div className='flex flex-column gap-4'>
                    <div className="flex flex-column gap-2">
                        <label>Email</label>
                        <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="flex flex-column gap-2 w-full">
                        <label>Password</label>
                        <Password className='w-full' id='password' inputClassName='w-full' pt={{ iconField: { root: { className: 'w-full' } } }} value={password} onChange={(e) => setPassword(e.target.value)} toggleMask />
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default Login