const express = require("express")
const path = require("path")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require('body-parser')
const app = express();
const bcrypt = require('bcrypt')
const jwt =  require('jsonwebtoken')
const dbPath = path.join(__dirname,"assignment.db")
const cors = require("cors")
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
let db = null;

const initializeDbAndServer = async()=>{
    try{
        db= await open({
            filename:dbPath,
            driver:sqlite3.Database
        });
        app.listen(4000,()=>{
            console.log(`Server is listening http://localhost:4000`);
        })
    }
    catch(error){
        console.log(`DB error : ${e.message}`)
        process.exit(1)
    }
}

initializeDbAndServer()

const authenticationToken = (request,response,next)=>{
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if(authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1]
    }
    if(authHeader == undefined){
        response.status(400)
        response.send("No Access Token")
    }
    else{
        jwt.verify(jwtToken,"assigned",(error,payload)=>{
            if(error){
                response.send("Invalid Access Token")
            }
            else{
                request.user_id = payload.id
                request.username = payload.username
                next()
            }
        })
    }
}


const todoDetails = (eachTodo)=>{
    return{
        id:eachTodo.id,
        user_id:eachTodo.user_id,
        todo:eachTodo.todo,
        description:eachTodo.description,
        status:eachTodo.status,
        priority:eachTodo.priority
    }
}


app.post("/register",async(request,response)=>{
    const {username,password} = request.body
    const newUserQuery = `SELECT * FROM users WHERE username="${username}";`
    const checkUser = await db.get(newUserQuery)
    const hashPassword = await bcrypt.hash(password,10)
    if(checkUser === undefined){
        const newUser = `INSERT INTO users(username,password)
        VALUES ("${username}","${hashPassword}")
        `
        await db.run(newUser)
        response.send("User created successfully")
    }
    else{
        response.status(400)
        response.send("User already exits")
    }
})


app.post("/login",async(request,response)=>{
    const {username,password} = request.body
    const userQuery = `
    SELECT * FROM users WHERE username="${username}"
    `
    const dbUser = await db.get(userQuery)
    if(dbUser === undefined){
        response.status(400)
        response.send("Invalid user")
    }
    else{
        const isPasswordMatched = await bcrypt.compare(password,dbUser.password)
        if(isPasswordMatched === true){
            const payload = {id:dbUser.id,username:username}
            const jwtToken = jwt.sign(payload,"assigned")
            response.send({jwtToken})
        }
        else{
            response.status(400)
            response.send("Invalid password")
        }
    }

})

app.get("/todos",authenticationToken,async(request,response)=>{
    const {user_id} = request 
    const {search='',priority=''} = request.query
    const todoQuery = `
    SELECT * FROM todo WHERE user_id=${user_id} AND todo LIKE "%${search}%" AND priority LIKE "%${priority}%";`
    const getTodo = await db.all(todoQuery)
    response.send(getTodo.map(eachTodo=> todoDetails(eachTodo)))
})

app.post("/todos",authenticationToken,async(request,response)=>{
    const {user_id} = request
    const {todo,description,status,priority} = request.body
    const todoQuery = `INSERT INTO todo (user_id,todo,description,status,priority) 
    VALUES (${user_id},"${todo}","${description}","${status}","${priority}");`
    await db.run(todoQuery)
    const newTodoQuery = `SELECT * FROM todo WHERE user_id = ${user_id}`
    const getTodoQuery = await db.all(newTodoQuery)
    response.send(getTodoQuery.map(eachTodo=> todoDetails(eachTodo)))
})

app.put('/status/:id',authenticationToken,async(request,response)=>{
    const {user_id} = request
    const {status} = request.body
    const {id} = request.params
    const todoQuery = `UPDATE todo SET status="${status}" WHERE id = ${id};`
    await db.run(todoQuery)
    const getTodoQuery = `SELECT * from todo WHERE user_id = ${user_id};`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})

app.put("/todos/:id",authenticationToken,async(request,response)=>{ 
    const {user_id} = request
    const {id} = request.params
    const {todo,description,status,priority} = request.body 
    const todoQuery = `UPDATE todo SET todo= "${todo}", description = "${description}", priority = "${priority}",
    status = "${status}" WHERE id = ${id};`
    await db.run(todoQuery)
    const newTodoQuery = `SELECT * FROM todo WHERE = ${user_id};`
    const getTodoQuery = await db.all(newTodoQuery)
    response.send(getTodoQuery.map(eachTodo=> todoDetails(eachTodo)))
})

app.delete("/todos/:id",authenticationToken,async(request,response)=>{
    const {user_id} = request
    const {id} = request.params
    const todoQuery = `DELETE FROM todo WHERE id = ${id};`
    await db.run(todoQuery)
    const newTodoQuery = `SELECT * FROM todo WHERE user_id = ${user_id};`
    const getTodoQuery = await db.all(newTodoQuery)
    response.send(getTodoQuery.map(eachTodo=> todoDetails(eachTodo)))
})



module.exports = app