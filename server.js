const express = require("express")
const mongoose = require("mongoose")
const app = express();
const bcrypt = require("bcryptjs")
const dotenv =require("dotenv")
const userModel = require("./models/userModel")
const session = require("express-session");
const { isAuthenticated, checkRole } = require("./middelwares/auth");
const { name } = require("ejs");
const deptModel = require("./models/deptModel");


app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))
app.use(express.json())

dotenv.config({ path: '.env' })

app.use(session({
    name:"sid",
    resave : true,
    saveUninitialized : true,
    secret:"secret",
    cookie:{
        maxAge:1000 * 30
    }
}))


//db connection 
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MONGODB CONNECTED"))
.catch((err)=>console.log(err))

// login get route
app.get("/login",(req,res)=>{
    res.render("login")
})

//login post route
app.post("/login",async (req,res)=>{
    const {email,password} = req.body
    if(!email && !password){
        res.status(404).json({message:"Enter Email and Password"})
    }

    const user = await userModel.findOne({email:email})

    if(!user){
        res.status(404).json({message:"Invalid Email or User Not Found"})
    }

    //checking password 
    const isValidUserFlag = await bcrypt.compare(password,user.password)
    if(!isValidUserFlag){
        res.status(404).json({message:"Incorrect Password"})
    }
    else {
        req.session.user = user
        res.redirect("/dashboard")
    }
})

//dashboard route
app.get("/dashboard",isAuthenticated,checkRole("admin"),(req,res)=>{
    const data = {}
    res.render("dashboard",{data})
})

app.get("/create-department",(req,res)=>{
    res.render("create-department")
})

app.post("/create-department",async(req,res)=>{
    const {name,type,address} = req.body
    if(!name && !type && !address){
        res.status(404).json({message:"Fill all the form fields"})
    }
    const newDept =await deptModel.create({
        name : name,
        type : type,
        address : address 
    })
    await newDept.save()
    res.redirect("/dashboard")
})


app.listen(process.env.PORT,()=>{
    console.log(`Server is running - http://localhost:${process.env.PORT}/login`);
})