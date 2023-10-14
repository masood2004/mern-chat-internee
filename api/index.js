const express = require("express");
const mongoose = require('mongoose');
const User = require("./models/User.js"); // requiring user schema from User.js
const jwt = require("jsonwebtoken"); // requiring Json Web Token to fetch the created User to the backend
const cors = require("cors"); //CORS stands for Cross-Origin Resource Sharing. It is a security feature implemented by web browsers to control and restrict web page scripts or XMLHttpRequests (XHR) in a web application running at one origin (domain) from making requests to a different origin (domain).
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL); // connecting API side to backend server

const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();

app.use(express.json()); //This line of code is configuring an Express.js web server to understand and parse incoming data in JSON format.

app.use(cookieParser());

app.use(cors({ //it's allowing a web server to accept requests from a different origin (domain), which is useful when you want to make requests from a client-side application to a server on a different domain.
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

app.get("/test", (req, res) => {
    res.json('ok');
});

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
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({userId: foundUser._id, username}, process.env.JWT_SECRET, {}, (err, token) => {
                res.cookie('token', token).json({
                    id: foundUser._id,
                })
            });
        }
    }
})

app.post("/register", async (req, res) => {
    const {username, password} = req.body; // requesting username and password from Register.jsx

    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username:username, 
            password: hashedPassword,
        }); // creating user on the basis of Mongoose User Schema
        jwt.sign({userId: createdUser._id, username}, process.env.JWT_SECRET, {}, (err, token) => { // using json web token to immediattly login user after registering
            if (err) throw err;
            res.cookie('token', token).status(201).json({
                id: createdUser._id, // fetcing objectId (userId) like this: 6526621ee262eb6bfe0a76d9
            });
        });
    } catch(err) {
        if (err) throw err;
    }

})

app.listen(4000, () => {
    console.log("server is up and running on port 4000.");
})
