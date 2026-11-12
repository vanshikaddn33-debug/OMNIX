const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    profilePicture: {
        type: String,
        default: ""
    },

    password: {
        type: String,
        required: true,
        select: false
    },
     googleId: {
        type: String,
        sparse: true
    },
    authProvider: {
        type: String,
        enum: ["local", "google", "both"],
        default: "local"
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
     isActive: {
        type: Boolean,
        default: true
    }
    
},
{
    timestamps: true
}
);

const user = mongoose.model("user", UserSchema);   //mongoose creates a model with name "user"

module.exports = user;