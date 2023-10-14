import { useContext, useState } from "react";
import axios from 'axios';
import { UserContext } from "./UserContext";


export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext); // extracting setUsername and setId function from the UserContext.jsx

    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoginOrRegister === "register" ? 'register' : 'login';
        const { data } = await axios.post(url, { username, password }); //making a request to a server's "/register" endpoint, and it's sending the user's username and password as data to the server

        setLoggedInUsername(username); // This line sets the username value in the client-side application to the value passed as username.It appears to be updating the currently logged-in username, indicating that the user is now registered and logged in.

        setId(data.id); // This line sets the id value in the client-side application to the id property retrieved from the data object in the response. This typically stores the unique identifier of the user, which is often returned by the server after a successful registration. This identifier is used to uniquely identify the user within the application.
    }

    return (
        <div className="bg-blue-50 h-screen flex items-center">
            <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <input
                    value={username}
                    onChange={ev => setUsername(ev.target.value)}
                    type="text"
                    placeholder="username"
                    className="block w-full rounded-sm p-2 mb-2 border">
                </input>
                <input
                    value={password}
                    onChange={ev => setPassword(ev.target.value)}
                    type="password"
                    placeholder="password"
                    className="block w-full rounded-sm p-2 mb-2 border">
                </input>
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'register' && (
                        <div>
                            Already a member?
                            <button onClick={() => {
                                setIsLoginOrRegister('login')
                            }}>
                                Login Here
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            Don't have an account?
                            <button onClick={() => {
                                setIsLoginOrRegister('register')
                            }}>
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}