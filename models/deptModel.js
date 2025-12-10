const mongoose = require("mongoose")

const deptModel = new mongoose.Schema({
    //name type address

// _id

    name:{
        type : String,
        unique: true,
        required:true
    },
    type:{
        type:String,
        enum : ["UG","PG","Research"],
        required:true
    },
    address:String 
})

module.exports = mongoose.model("department",deptModel)