import mongoose, {isValidObjectId} from "mongoose"
//import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const { _id: subscriberId } = req.user; 

    const existingSubscription = await Subscription.findOne({ channel: channelId, subscriber: subscriberId });
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.
        status(200).
        json(
            new ApiResponse(
            200, {}, "Unsubscribed successfully")
        );
    }
    const newSubscription = await Subscription.create({ channel: channelId, subscriber: subscriberId });
    return res
    .status(201)
    .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }
    const subscribers = await Subscription.find({channel: channelId})
    .populate("subscriber", "username avatar fullName")
    .exec()
    const response = new ApiResponse(200, subscribers)
    res.json(response)  

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar fullName") // Fetch channel details
        .sort({ createdAt: -1 });

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}