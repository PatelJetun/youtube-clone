import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import isValidId from "../utils/isValidId.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const videoExists = await Video.exists({ _id: videoId });

  if (!videoExists) {
    throw new ApiError(404, "Video does not exist");
  }

  const deletedLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: userId,
  });

  if (deletedLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Video unliked successfully"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
