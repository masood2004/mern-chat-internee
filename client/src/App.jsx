import axios from 'axios';
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";



function App() {
  axios.defaults.baseURL = "http://localhost:4000" // this code is telling Axios that whenever you make an HTTP request using Axios without specifying a full URL, it should use "http://localhost:4000" as the base URL for that request.
  axios.defaults.withCredentials = true; // this code is telling Axios to include any necessary information (like cookies or authentication) when it communicates with a server. This is important when you need to maintain user sessions or authentication states between the client (your web application) and the server.
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}

export default App;
