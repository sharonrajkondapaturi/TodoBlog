const express = require("express")
const path = require("path")
const {open} = require("sqlite")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require('body-parser')
const app = express();
const dbPath = path.join(__dirname,"todo.db")
const cors = require("cors")
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
let db = null;

const initializeDbAndServer = async()=>{
    try{
        db = await open({
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

const todoList = (eachTodo)=>{
    return {
        id:eachTodo.id,
        todoName:eachTodo.todoName,
        task1:eachTodo.task1,
        task2:eachTodo.task2,
        task3:eachTodo.task3,
        priority:eachTodo.priority,
        accomplished:eachTodo.accomplished
    }
}


initializeDbAndServer()

app.get('/todo',async(request,response)=>{
    const {search='',priority=''} = request.query
    const getTodoQuery = `SELECT * from todo WHERE todoName LIKE "%${search}%" AND priority LIKE "%${priority}%";`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})
app.post('/addTodo',async(request,response)=>{
    const {todoName,task1,task2,task3,priority,accomplished} = request.body
    const todoQuery = `INSERT INTO todo(todoName,task1,task2,task3,priority,accomplished) VALUES ("${todoName}","${task1}","${task2}","${task3}","${priority}","${accomplished}");`
    await db.run(todoQuery)
    const getTodoQuery = `SELECT * from todo;`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})

app.put('/updateTodo/:id',async(request,response)=>{
    const {todoName,task1,task2,task3,priority,accomplished} = request.body
    const {id} = request.params
    const todoQuery = `UPDATE todo SET todoName="${todoName}",task1="${task1}",task2="${task2}",task3="${task3}",priority="${priority}",accomplished="${accomplished}" 
    WHERE id = ${id};`
    await db.run(todoQuery)
    const getTodoQuery = `SELECT * from todo;`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})

app.put('/updateAccomplished/:id',async(request,response)=>{
    const {accomplished} = request.body
    const {id} = request.params
    const todoQuery = `UPDATE todo SET accomplished="${accomplished}" WHERE id = ${id};`
    await db.run(todoQuery)
    const getTodoQuery = `SELECT * from todo;`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})

app.delete('/deleteTodo/:id',async(request,response)=>{
    const {id} = request.params 
    const todoQuery = `DELETE FROM todo WHERE id=${id};`
    await db.run(todoQuery)
    const getTodoQuery = `SELECT * FROM todo;`
    const todoArray = await db.all(getTodoQuery)
    response.send(todoArray.map(eachTodo=> todoList(eachTodo)))
})

module.exports = app