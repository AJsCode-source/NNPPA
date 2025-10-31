const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/login-navy/users-login/users');

mongoose.connect('mongodb://localhost:27017/navylogin').then(() => {
    console.log("Connected to the database successfully");
}).catch((err) => {
    console.log("Error connecting to the database:", err);
});

// now create schema
// mongodb://localhost:27017/
const userSchema = new mongoose.Schema({
    svcNo: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});
 
// next create model
const collection = new mongoose.model("loginuser", userSchema);

// export the model
module.exports = collection;

const User = mongoose.model('User', userSchema);
