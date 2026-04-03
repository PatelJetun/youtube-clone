import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import isValidId from "../utils/isValidId.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const userId = req.user._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Tweet Content Is Required");
  }

  const tweet = await Tweet.create({ content: content, owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Uploaded Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User Id Missing");
  }

  if (!isValidId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw new ApiError(400, "No Such User Exists");
  }

  const tweet = await Tweet.find({ owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!tweetId) {
    throw new ApiError(400, "Tweet Id Missing");
  }

  if (!content) {
    throw new ApiError(400, "Tweet Content Is Required");
  }

  if (!isValidId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweetExists = await Tweet.exists({ _id: tweetId, owner: userId });

  if (!tweetExists) {
    throw new ApiError(404, "Tweet Not Found");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content: content },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!tweetId) {
    throw new ApiError(400, "Tweet Id Missing");
  }

  if (!isValidId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweetExists = await Tweet.exists({ _id: tweetId, owner: userId });

  if (!tweetExists) {
    throw new ApiError(404, "Tweet Not Found");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(204)
    .json(new ApiResponse(204, null, "Tweet Deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
