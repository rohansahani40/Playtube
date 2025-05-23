import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Playlist name and description are required");
    }

    const playlist = await Playlist.create({
        owner: req.user._id,
        name,
        description,
        videos: []
    });

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }
    const playlists = await Playlist.find({owner: userId}).sort({ createdAt: -1 });
    
    return res
    .status(200)
    .json(new ApiResponse(200, playlists))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)
    .populate("videos", "title thumbnail duration")
    
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(201)
    .json (new ApiResponse(200,playlist,"playlist fetch successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
    await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "Playlist name or description is required");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true, runValidators: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}