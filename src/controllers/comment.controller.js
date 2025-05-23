import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
     if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id") }

     const comments = await Comment.find({video: videoId})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()
    const count = await Comment.countDocuments({video: videoId})
    const response = new ApiResponse(200, {comments, totalPages: Math.ceil(count / limit), currentPage: page})
    res.json(response)   
    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    });

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findByIdAndUpdate(commentId, 
        { content }, 
        { new: true, runValidators: true });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }