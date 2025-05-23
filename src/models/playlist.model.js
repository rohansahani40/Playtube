import mongoose,{model,Schema} from "mongoose";

const playlistSchema=new mongoose.Schema({

    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    videos:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    name:{
        type: String,
        required:true
    },
    discription:{
        type: String,
        required:true
    }


},{timestamps:true})
export const Playlist = mongoose.model('Playlist', playlistSchema);