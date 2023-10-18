const express = require("express");
const mongoose = require('mongoose');
const User = require("./models/User.js"); // requiring user schema from User.js
const jwt = require("jsonwebtoken"); // requiring Json Web Token to fetch the created User to the backend
const cors = require("cors"); //CORS stands for Cross-Origin Resource Sharing. It is a security feature implemented by web browsers to control and restrict web page scripts or XMLHttpRequests (XHR) in a web application running at one origin (domain) from making requests to a different origin (domain).
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const ws = require("ws");
const util = require('util');
const Message = require('./models/Message.js');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL); // connecting API side to backend server

const bcryptSalt = bcrypt.genSaltSync(10);

const jwtVerify = util.promisify(jwt.verify);

const app = express();

app.use(express.json()); //This line of code is configuring an Express.js web server to understand and parse incoming data in JSON format.

app.use(cookieParser());

app.use(cors({ //it's allowing a web server to accept requests from a different origin (domain), which is useful when you want to make requests from a client-side application to a server on a different domain.
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    const token = req.cookies?.token;
    if (token) {
        try {
            const userData = await jwtVerify(token, process.env.JWT_SECRET);
            return userData;
        } catch (err) {
            // Handle the JWT verification error gracefully
            throw err; // You may choose to handle this differently
        }
    } else {
        throw new Error('No token');
    }
}

app.get("/test", (req, res) => {
    res.json('ok');
});

app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
    });
    res.json(messages);
});

app.get('/people', async (req, res) => {
    const users = await User.find({}, { '_id': 1, username: 1 });
    res.json(users);
})

app.get("/profile", (req, res) => {
    const token = req.cookies?.token; // extracts the "token" property from the cookies of the incoming HTTP request.
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => { // This line verifies a JSON Web Token (JWT) using a library that appears to be named jwt.
            if (err) throw err;
            res.json(userData); // If the JWT is successfully verified, the code responds to the client with the JSON representation of the userData.
        });
    } else {
        res.status(401).json("no token");
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username }, process.env.JWT_SECRET, {}, (err, token) => {
                res.cookie('token', token).json({
                    id: foundUser._id,
                })
            });
        }
    }
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
})

app.post("/register", async (req, res) => {
    const { username, password } = req.body; // requesting username and password from Register.jsx

    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username: username,
            password: hashedPassword,
        }); // creating user on the basis of Mongoose User Schema
        jwt.sign({ userId: createdUser._id, username }, process.env.JWT_SECRET, {}, (err, token) => { // using json web token to immediattly login user after registering
            if (err) throw err;
            res.cookie('token', token).status(201).json({
                id: createdUser._id, // fetcing objectId (userId) like this: 6526621ee262eb6bfe0a76d9
            });
        });
    } catch (err) {
        if (err) throw err;
    }

})

const server = app.listen(4000, () => {
    console.log("server is up and running on port 4000.");
});

const wss = new ws.WebSocketServer({ server }); // This line of code creates a WebSocket server using the 'ws' library. WebSocket server will use the same underlying HTTP server to handle WebSocket connections.

wss.on('connection', (connection, req) => { // This code sets up an event handler for the 'connection' event on the WebSocket server.

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify(
                {
                    online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
                }
            ))
        })
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log('dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    })

    // read username and id from the cookie for this connection

    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                    if (err) throw err;
                    const { userId, username } = userData;
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text } = messageData;
        if (recipient && text) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
            });
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    _id: messageDoc._id,
                })));
        }
    });

    // notify everyone about online people (when someone connects)

    notifyAboutOnlinePeople();
});

