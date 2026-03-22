import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import isValidId from "../utils/isValidId.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user = req?.user;
  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(400, "Playlist Name or Description Missing");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "An Error Occured While Creating Playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, `Playlist: ${name}, Created Successfully`)
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  if (!userId) {
    throw new ApiError(400, "User Not Found");
  }

  const userPlaylist = await Playlist.find({ owner: userId });

  if (!userPlaylist.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No Playlist Exists For"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "Playlist Fetched Successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

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
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: {
              path: "$owner",
              preserveNullAndEmptyArrays: true,
            },
          },
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
              subscriberCount: {
                $size: "$subscribers",
              },
              channelName: "$owner.username",
              avatar: "$owner.avatar",
            },
          },
          {
            $project: {
              channelName: 1,
              avatar: 1,
              subscriberCount: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!playlist.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "No Playlist Data Found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidId(playlistId) || !isValidId(videoId)) {
    throw new ApiError(400, "Playlist or Vidoe Does Not Exists");
  }

  const video = await Video.findOne({ _id: videoId, isPublished: true });

  if (!video) {
    throw new ApiError(400, "No Such Video Exists");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Could Not Find The Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
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
