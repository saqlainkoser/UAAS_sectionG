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
const {sendMailer} = require("./scripts/test-script.js")

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

app.get("/delete_department/:id",async(req,res)=>{
    const dId = req.params.id
    await deptModel.findByIdAndDelete(dId)
    res.redirect("/departments")
})

app.get("/edit-department/:id",async (req,res)=>{
    const curDept = await deptModel.findById(req.params.id)
    res.render("edit-department",{curDept})
})

app.post("/edit-department/:id",async (req,res)=>{
    await deptModel.findByIdAndUpdate(req.params.id , req.body)
    res.redirect("/departments")
})

app.get("/create-user",async(req,res)=>{
    const deptData = await deptModel.find({},"name")
    res.render("create-user",{deptData})
})

app.post("/create-user",async(req,res)=>{
    const newUser = await userModel.create(req.body)
    await newUser.save()

    const mailTo = newUser.email
    const subject = "User Credentials To Login"
    const text = "UserId : " + newUser.email + " Password : 12345"
    const html = `<a href='http://localhost:3555/change-password?email=${newUser.email}  >Click Here to Reset Password</a>`
    // await sendMailer(mailTo,subject,text,html)

    res.redirect("/departments")
})

app.get("/change-password",(req,res)=>{
    const email = req.query.email
    res.render("password-reset",{email})
})

app.post("/change-password/:email",async(req,res)=>{
    await userModel.findOneAndUpdate({email:req.params.email},{$set:{password:req.body.password} })
    res.redirect("/dasboard")
})

app.get("/users",async(req,res)=>{
    const users = await userModel.find({role:{$ne:"admin"}}).populate('department')
    // res.json(users)
    const depts = await deptModel.find()
    res.render('users-list',{users,depts})
})

app.get("/edituser/:id",async(req,res)=>{
})

app.get("/deleteuser/:id",async(req,res)=>{
    await userModel.findByIdAndDelete(req.params.id)
    res.redirect("/users")
})



app.get("/edituser/:id",async(req,res)=>{
    await userModel.findByIdAndUpdate(req.params.id,req.body)
    res.redirect("/users")
})

app.get("/usersdata",async(req,res)=>{
    const users = await userModel.find({role:{$ne:"admin"}}).populate('department')
    // res.json(users)
    res.json({data:users})
})




app.listen(process.env.PORT,()=>{
    console.log(`Server is running - http://localhost:${process.env.PORT}/users`);
})