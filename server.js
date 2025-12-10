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
const cookieParser = require("cookie-parser")

app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())

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
    let message = ''
    if(req.cookies.flashmsg){
        message=req.cookies.flashmsg
        res.cookie("flashmsg","")
    }
    res.render("dashboard",{message})
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

    res.cookie("flashmsg","DepartMent Created")

    res.redirect("/dashboard")
})


app.get("/departments",async(req,res)=>{
    const search = req.query.search || ""
    const type = req.query.type ||  'all'

    const matchStage = {};

    if(search.trim() !== "" ){
        matchStage.name = {$regex : search ,$options : "i" } // case-insensitive
    }

    //Filter by tyoe 
    if(type !== "all"){
        matchStage.type = type
    }



    const data = await deptModel.aggregate([
        //filter stage
        {$match : matchStage},
        {
            $lookup:{
                from : "uaasusers",
                localField : "_id",
                foreignField : "department",
                as : "users"
            }
        },
        {
            $project:{
                name: 1,
                type: 1,
                address: 1,
                userCount : { $size : "$users" }
            }
        }
    ])
    console.log(data);
    
    res.render("departments",{data , search ,type })
})

app.get("/delete_deapartment/:id",async(req,res)=>{
    const dId = req.params.id
    await deptModel.findByIdAndDelete(dId)
    res.redirect("/departments")
})




app.listen(process.env.PORT,()=>{
    console.log(`Server is running - http://localhost:${process.env.PORT}/login`);
})