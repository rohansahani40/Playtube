import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}= req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"user id not found")
    }

    const userTweets= await Tweet.find({owner:userId})
    .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(200,userTweets,"user tweet fetch successfully")

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
   if(!isValidObjectId(tweetId)){
    throw new ApiError(404,"tweet  id not found")
}
if(!content?.trim()){
    throw new ApiError(404,"tweet content should not be empty")
}
   const updatedTweet=await Tweet.findByIdAndUpdate(
    tweetId,
    {$set:{
        content
    }},
    {
        new:true,
        runValidaters:true
    }
   )

if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found");
}

return res
.status(200)
.json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}= req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"tweet  id not found")
    }

    const deletedTweet=await Tweet.findByIdAndDelete(tweetId)
    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found");
    }
    return res 
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}