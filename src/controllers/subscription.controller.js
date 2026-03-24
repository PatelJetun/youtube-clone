import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import isValidId from "../utils/isValidId.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req?.user?._id;

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!channelId) {
    throw new ApiError(400, "Channel Id is required");
  }

  if (!isValidId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  if (channelId.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  // Check existing subscription
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  const isSubscribed = Boolean(existingSubscription);

  // Toggle logic
  if (isSubscribed) {
    await Subscription.deleteOne({ _id: existingSubscription._id });
  } else {
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
  }

  // Response
  const response = {
    subscribed: !isSubscribed,
  };

  const message = isSubscribed
    ? "Unsubscribed successfully"
    : "Subscribed successfully";

  return res.status(200).json(new ApiResponse(200, response, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel Id Missing");
  }

  if (!isValidId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }

  const channel = await Subscription.find({ channel: channelId });

  const response = {
    subscriberCount: channel.length,
    data: channel,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Subscribers Fetched Successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!isValidId(subscriberId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  });

  if (!subscribedChannels) {
    throw new ApiError(
      500,
      "An Error Occured While Fetching Subscribed Channels"
    );
  }

  const response = {
    subscribedChannelsCount: subscribedChannels.length,
    data: subscribedChannels,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Subscribed Channels Fetched Successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
