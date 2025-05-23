import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
      path: './.env'
  })

connectDB()
.then(() => { 
      app.listen(process.env.PORT ||9000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
      });
}).catch((err) => {
      console.log("Error connecting to MongoDB", err);
});
 
 





// .then(()=>{
//       app.listen(process.env.PORT ||8000 ,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`)
//       })     
// })
// .catch((err)=>{
//       console.log("Rohan !!! Error connecting to MongoDB",err)
// })


/*
// Connect to MongoDB way 1 direct method
; (async()=>{
      try {
            await mongoose.connect( `${process.env.MONGO_URI}/${DB_NAME}`)
            app.on("error",(err)=>{
                    console.log("Error connecting to MongoDB",err)  ;
                   throw err;
      })
            app.listen(process.env.PORT,()=>{
                  console.log(`Server is running on port ${process.env.PORT}`)
            })
      }
      catch(err) {
            console.log("Error connecting to MongoDB",err)
            throw err
      }
})();
*/