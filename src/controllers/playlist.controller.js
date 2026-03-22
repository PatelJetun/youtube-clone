import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

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

  if (!mongoose.isValidObjectId(userId)) {
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
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
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
