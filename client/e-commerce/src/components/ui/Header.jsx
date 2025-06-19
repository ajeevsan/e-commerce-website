import './style.css'
import { RxAvatar } from "react-icons/rx";


export const Header = () => {
    return (
        <>
            <div className="header-container">
                <div className="header-section">
                    <span className='img-section'>
                        <img src="./arti.png" alt="arti-logo" />
                    </span>

                    <nav>
                        <ul>
                            <li>
                                <div>Avatar Icon</div>
                            </li>
                            <li>
                                Cart Icon
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}
