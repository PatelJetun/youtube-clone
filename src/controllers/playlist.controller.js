import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import isValidId from "../utils/isValidId.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req?.user;

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User Id is required");
  }

  if (!isValidId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const playlists = await Playlist.find({ owner: userId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        playlists.length
          ? "Playlists fetched successfully"
          : "No playlists found"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is required");
  }

  if (!isValidId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          { $match: { isPublished: true } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "subscriptions",
              localField: "owner._id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscriberCount: { $size: "$subscribers" },
              channelName: "$owner.username",
              avatar: "$owner.avatar",
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
              createdAt: 1,
              channelName: 1,
              avatar: 1,
              subscriberCount: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!playlist.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const user = req?.user;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist Id and Video Id are required");
  }

  if (!isValidId(playlistId) || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid Playlist or Video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(user?._id)) {
    throw new ApiError(403, "Forbidden");
  }

  const video = await Video.findOne({
    _id: videoId,
    isPublished: true,
  });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const user = req?.user;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist Id and Video Id are required");
  }

  if (!isValidId(playlistId) || !isValidId(videoId)) {
    throw new ApiError(400, "Invalid Playlist or Video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(user?._id)) {
    throw new ApiError(403, "Forbidden");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const user = req?.user;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is required");
  }

  if (!isValidId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: user?._id,
  });

  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const user = req?.user;

  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is required");
  }

  if (!isValidId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: user?._id },
    {
      $set: { name, description },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
