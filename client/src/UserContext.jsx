import axios from "axios";
import { createContext, useEffect, useState } from "react";
// This code is related to managing application state using React's context API. It defines a context and a context provider for storing and sharing user-related data throughout your React application.


export const UserContext = createContext({}); // Here, you create a new context called UserContext. Initially, it's set to an empty object as a default value. This context will be used to store and share user-related data, such as the user's username and ID, across components in your application.

export function UserContextProvider({children}) { //This defines a React component called UserContextProvider. It receives a single prop called children, which represents the child components that will be wrapped by this provider.
    const [username, setUsername] = useState(null);
    const [id, setId] = useState(null);

    useEffect(() => { // we are using it so we can send response/data to the end point "/profile".
        axios.get("/profile").then(response => {
            setId(response.data.userId);
            setUsername(response.data.username);
        });
    }, []); // the empty array [] as the second argument means that the effect runs only once when the component is mounted

    return (
        // This is a special component provided by React's context API. It's used to create a context provider for the context you've defined earlier in your code (likely named UserContext).
        <UserContext.Provider value={{username, setUsername, id, setId}}> 
            {children}
        </UserContext.Provider>

        // In React, children is a special prop that represents the components or elements nested within the opening and closing tags of a component. In this case, the UserContext.Provider is expected to wrap around other components and elements.
    );
}

