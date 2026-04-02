import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
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
  //TODO: toggle like on comment
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!isValidId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const commentExists = await Comment.exists({ _id: commentId });

  if (!commentExists) {
    throw new ApiError(404, "Comment does not exist");
  }

  const deletedLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: userId,
  });

  if (deletedLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Comment unliked successfully"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!isValidId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweetExists = await Tweet.exists({ _id: tweetId });

  if (!tweetExists) {
    throw new ApiError(404, "Tweet does not exist");
  }

  const deletedLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: userId,
  });

  if (deletedLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet unliked successfully"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        video: { $exists: true, $ne: null },
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        _id: 0,
        video: "$videoDetails",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked Videos Fetched Successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
