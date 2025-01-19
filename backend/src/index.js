import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})

import { connect_DB } from './db/index.js'
import { app } from './app.js'

connect_DB()
.then(()=>{
    app.listen(process.env.PORT || "8000" , ()=>{
        console.log(`Server Is Running At Port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`MongoDB Connection Failed : ${error}`);
})