import mongoose,{model, Schema } from "mongoose";
 const subscriptionSchema= new mongoose.Schema({
    
    subscriber:{
        type:Schema.Types.ObjectId,  //the user the subscribe the chanel
        ref:"User"
    },
     
    channel:{
        type:Schema.Types.ObjectId,  //the ower of the chanel
        ref:"User"
    }

 },
 {timestamps:true})
 
export const Subscription = mongoose.model("Subscription",subscriptionSchema)
