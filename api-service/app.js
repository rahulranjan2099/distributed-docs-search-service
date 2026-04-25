require("dotenv").config({
  path: process.env.NODE_ENV === "docker" ? ".env.docker" : ".env",
});
const express = require('express')
const app = express()
const cors = require('cors')
const { connectProducer } = require('./config/kafka')

const PORT = process.env.PORT

// middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// routes
const docsRoute = require('./routes/docs')
const tenantRoute = require('./routes/tenant')

app.use('/documents', docsRoute)
app.use('/tenants', tenantRoute)

connectProducer()

app.listen(PORT, ()=>{
    console.log('Listening to Port:', PORT)
})
3