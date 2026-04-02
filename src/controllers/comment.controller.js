import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import isValidId from "../utils/isValidId.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const options = {
    page: pageNum,
    limit: limitNum,
  };

  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  const comment = await Comment.aggregatePaginate(commentAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Feteched Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!isValidId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if (!content) {
    throw new ApiError(400, "Comment Content Is Required");
  }

  const comment = await Comment.create({
    video: videoId,
    owner: userId,
    content: content,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Uploaded Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const userId = req.user._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Comment Content Required");
  }

  if (!isValidId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const commentExists = await Comment.exists({ _id: commentId, owner: userId });

  if (!commentExists) {
    throw new ApiError(404, "Comment Not Found");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { content: content },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }

  const commentExists = await Comment.exists({ _id: commentId, owner: userId });

  if (!commentExists) {
    throw new ApiError(404, "Comment Not Found");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
