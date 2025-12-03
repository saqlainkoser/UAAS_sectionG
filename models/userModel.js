const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { type } = require("os")

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required : true,
        unique : true
    },
    password:{
        type:String,
        required : true,
    },
    role:{
        type:String,
        enum:["student","admin",'hod','professor'],
        default:"student"
    },
    firstName:{
        type : String,
        required : true
    },
    lastName:{
        type: String
    },
    department:{
        type:String
    },
    isActive:{
        type: Boolean,
        default : true 
    }
},
{ timestamps : true }
)

const userModel = mongoose.model("uaasuser",userSchema)
module.exports = userModel
