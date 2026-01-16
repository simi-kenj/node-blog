const express = require("express")
const app = express()
app.use(express.urlencoded({ extended: true }))
const mongoose = require("mongoose")
app.set("view engine", "ejs")
app.use("/public", express.static("public"))
const session = require("express-session")

// Session
app.use(session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
}))

// Connecting to MongoDB
mongoose.connect("*****")
    .then(() => {
        console.log("Success: Connected to MongoDB")
    })
    .catch((error) => {
        console.error("Failure: Unconnected to MongoDB")
    })

// Defining Schema and Model
const Schema = mongoose.Schema

const BlogSchema = new Schema({
    title: String,
    summary: String,
    image: String,
    textBody: String,
})

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const BlogModel = mongoose.model("Blog", BlogSchema)
const UserModel = mongoose.model("User", UserSchema)

// ブログ関係機能

// Create a blog
app.get("/blog/create", (req, res) => {
    // res.sendFile(__dirname + "/views/blogCreate.html")
    // res.render("blogCreate")
    if(req.session.userId){
        res.render("blogCreate")
    }
    else{
        res.redirect("/user/login")
    }
})

// Write blogs
app.post("/blog/create", (req, res) => {
    // console.log( "reqの中身", req )
    // console.log("reqの中身", req.body)
    BlogModel.create(req.body)
        .then(() => {
            // console.log("データの書き込みが成功しました")
            // res.send("ブログデータの投稿が成功しました")
            res.redirect("/")
        })
        .catch((error) => {
            // console.log(error)
            // console.log("データの書き込みが失敗しました")
            // res.send("ブログデータの投稿が失敗しました")
            res.render("error", {message: "/blog/createのエラー"})
        })
})

// Read All blogs
app.get("/", async (req, res) => {
    const allBlogs = await BlogModel.find()
    // console.log("reqの中身：", req)
    // console.log("allBlogの中身：", allBlogs)
    // res.send("全ブログデータを読み取りました")
    // res.render("index", { allBlogs })
    res.render("index", {
        allBlogs: allBlogs,
        session: req.session.userId
    })
})

// Read Single blog
app.get("/blog/:id", async (req, res) => {
    // console.log( req.params.id )
    const singleBlog = await BlogModel.findById(req.params.id)
    // console.log("singleBlogの中身：", singleBlog)
    // console.log("個別の記事ページ")
    // res.render("blogRead", { singleBlog })
    res.render("blogRead", {
        singleBlog: singleBlog,
        session: req.session.userId
    })
})

// Update blog
app.get("/blog/update/:id", async (req, res) => {
    const singleBlog = await BlogModel.findById(req.params.id)
    // console.log("singleBlogの中身：", singleBlog)
    // res.send("個別の記事編集ページ")
    res.render("blogUpdate", { singleBlog })
})

app.post("/blog/update/:id", (req, res) => {
    BlogModel.updateOne({ _id: req.params.id }, req.body)
        .then(() => {
            // console.log("データの編集が成功しました")
            // res.send("ブログデータの編集が成功しました")
            res.redirect("/")
        })
        .catch((error) => {
            // console.log("データの編集が失敗しました")
            // res.send("ブログデータの編集が失敗しました")
            res.render("error", {message: "/blog/updateのエラー"})
        })
})

// Delete blog
app.get("/blog/delete/:id", async (req, res) => {
    const singleBlog = await BlogModel.findById(req.params.id)
    // console.log("singleBlogの中身：", singleBlog)
    // res.send("個別の記事削除")
    res.render("blogDelete", { singleBlog })
})

app.post("/blog/delete/:id", (req, res) => {
    BlogModel.deleteOne({ _id: req.params.id })
        .then(() => {
            // console.log("データの削除が成功しました")
            // res.send("ブログデータの削除が成功しました")
            res.redirect("/")
        })
        .catch((error) => {
            // console.log("データの削除が失敗しました")
            // res.send("ブログデータの削除が失敗しました")
            res.render("error", {message: "/blog/deleteのエラー"})
        })
})

// Create user
app.get("/user/create", (req, res) => {
    res.render("userCreate")
})

app.post("/user/create", (req, res) => {
    UserModel.create(req.body)
        .then(() => {
            // console.log("ユーザーデータの書き込みが成功しました")
            // res.send("ユーザーデータの登録が成功しました")
            res.redirect("/user/login")
        })
        .catch((error) => {
            // console.log("ユーザーデータの書き込みが成功しました")
            // res.send("ユーザーデータの登録が成功しました")
            res.render("error", {message: "/user/createのエラー"})
        })
})

// Login
app.get("/user/login", (req, res) => { res.render("login") })

app.post("/user/login", (req, res) => {
    UserModel.findOne({email: req.body.email})
        .then((savedData) => {
            if(savedData){
                // ユーザーが存在する場合の処理
                if(req.body.password === savedData.password){
                    // パスワードが正しい場合の処理
                    req.session.userId = savedData._id.toString()
                    // res.send("ログイン成功です")
                    res.redirect("/")
                }
                else{
                    // パスワードが間違っている場合の処理
                    // res.send("パスワードが間違っています")
                    res.render("error", {
                        message: "/user/loginのエラー: パスワードが間違っています"
                    })
                }
            }
            else{
                // ユーザーが存在しない場合の処理
                // res.send("ユーザーが存在していません")
                res.render("error", {
                    message: "/user/loginのエラー: ユーザーが存在していません"
                })
            }
        })
        .catch((err) => {
            // res.send("エラーが発生しました")
            res.render("error", {
                message: "/user/loginのエラー: エラーが発生しました"
            })
        })
})

// Page NotFound
app.get(/.*/, (req, res) => {
    res.render("error", {
        message: "ページが存在しません"
    })
})

// Connecting to port
app.listen(3000,
    () => {
        console.log("Listening on localhost port 3000")
    }
)
