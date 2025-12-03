const mongoose = require("mongoose")
const userModel = require("../models/userModel")
const bcrypt = require("bcryptjs")


mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/UAAS_sectionG")
.then(()=>console.log("MONGODB CONNECTED"))
.catch((err)=>console.log(err))


async function addAdminCred(){

// salt - value , 
// will define how much harder you password will encoded and time consuming to decode 
  const salt = await bcrypt.genSalt(10)
  const hasedPassword =await bcrypt.hash("12345",salt) 

  const admin = await userModel.create({
    email:"admin@12345",
    password:hasedPassword,
    role:"admin",
    firstName:"admin",
  }) 
  await admin.save()
  console.log(admin);
  console.log("ADMIN ADDED");
}


addAdminCred()

