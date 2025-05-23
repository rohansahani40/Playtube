import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Fetch total videos uploaded by the channel
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Fetch total views of all videos uploaded by the channel
    const totalViews = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    // Fetch total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Fetch total likes received on videos
    const totalLikes = await Like.countDocuments({ video: { $exists: true }, likedBy: channelId });

    return res
        .status(200)
        .json(new ApiResponse(200, {
        totalVideos,
        totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0,
        totalSubscribers,
        totalLikes
    }, "Channel statistics fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ owner: channelId })
        .populate("owner", "username avatar fullName")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }