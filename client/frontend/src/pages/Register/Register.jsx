import { useState, useRef } from 'react'
import { registerUser } from '../../api/authApi'
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
        


export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [warning, setWarning] = useState(false)

    const toast = useRef(null);
    

    const footer = (
        <div className='flex justify-content-center'>
            <Button label="Create" onClick={handleRegister} />
        </div>
    );

    async function handleRegister(){
        try {
            await registerUser({name, email, password})
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Successfully Registered !!!' });

            //! Navigating to the Login Page 
            setTimeout(() => {
                navigate('/login')
            },2000)

        } catch (error) {
            console.error('Register Failed', error)
        }
    }


    return (
        <div className='flex justify-content-center align-items-center h-screen'>
            <Card title="Register" footer={footer} className="md:w-25rem ">
                <div className='flex flex-column gap-4'>
                    <div className="flex flex-column gap-2">
                        <label>Name</label>
                        <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
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

