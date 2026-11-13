const User = require("../models/User");
const {hashPassword, comparePassword} = require("../utils/passwordUtils");
const {generateToken} = require("../utils/jwtUtils");
const {OAuth2Client} = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const registerUser = async(req,res) => {
    try{
        const {username,email,password} = req.body;

        if(!username || !email || !password){
            return res.status(400).json({
                message: "Please provide username, email and password"
            });
        }

        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const token = generateToken(newUser._id);
        return res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    }
    catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const LoginUser = async(req,res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if(!user || !user.password){
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if(!user.isActive){
            return res.status(403).json({
               message: "Your account is inactive"
            });
        }

        const isMatch = await comparePassword(password, user.password);

        if(!isMatch){
            return res.status(401).json({
              message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Login successfull",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch(error){
        console.log("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const googleAuth = async(reqq,res) => {
    try{
        const {idToken} = req.body;

        if(!idToken){
            return res.status(400).json({
                message: "Google ID token is required"
            });
        }

        if(!process.env.GOOGLE_CLIENT_ID){
            return res.status(500).json({
                message: "Google authentication is not configured"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const {
            sub: googleId,
            name,
            email,
            picture,
            email_verified
        } = payload;

         if (!email || !email_verified) {
            return res.status(401).json({
                message: "Google email is not verified"
            });
        }

        let user = await User.findOne({ googleId });

         if (!user) {
            const existingUser = await User.findOne({
                email: email.toLowerCase()
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "An account with this email already exists. Please log in using your existing method."
                });
            }

            user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                profilePicture: picture || "",
                authProvider: "google",
                isEmailVerified: true
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is inactive"
            });
        }
         
        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Google authentication successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });

    }
    catch(error){
        console.error("Google authentication error:", error);
        return res.status(401).json({
            message: "Google authentication failed"
        });
    }
};



const logoutUser = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Logout successful. Please clear your authentication token."
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser
};