const express = require("express");
const {
  transporter,
  sendVerificationCodeToPhoneNumber,
  verifySmsCode,
} = require("../utils/services");
const {
  storeDataInDatabase,
  getDataFromDatabase,
  getAllDocumentsFromCollection,
  findOrCreateChat,
  storeMessage,
  getLikedMeProfiles,
  countDocumentsInCollection,
} = require("../utils/helpers");
const { DB_COLLECTIONS } = require("../utils/constants");
const { compact, includes, replace } = require("lodash");

const router = express.Router();

router.post("/send-verification-email", (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit code
  const mailOptions = {
    from: process.env.HARMONIZED,
    to: email,
    subject: "Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to send verification email" });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({
        success: true,
        message: "Verification email sent",
        code: verificationCode,
      });
    }
  });
});

router.post("/send-verification-sms", async (req, res) => {
  const { to } = req.body;
  const phoneNumber = replace(to, /\s+/g, "");
  const verificationCode = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit code
  try {
    await sendVerificationCodeToPhoneNumber(phoneNumber, verificationCode);
    res.status(200).json({
      success: true,
      message: "Verification code sent",
      code: verificationCode,
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to send verification code" });
  }
});

router.post("/verify-sms-code", async (req, res) => {
  const { to, code } = req.body;
  try {
    const status = await verifySmsCode(to, code);
    console.log("here", status);
    res.status(200).json({
      success: status,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false });
  }
});

router.post("/create-user", async (req, res) => {
  const { user } = req.body;
  const id = user.id;
  const registeredUser = await getDataFromDatabase(DB_COLLECTIONS.users, id);
  if (!registeredUser) {
    const status = await storeDataInDatabase(
      { id, profile: user },
      DB_COLLECTIONS.users,
      id
    );
    if (status) {
      res
        .status(200)
        .json({ success: true, message: "User registered successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to register user" });
    }
  } else {
    res.status(500).json({
      success: true,
      userData: {
        id: registeredUser?.id,
        ...registeredUser?.profile,
      },
      message: registeredUser?.profile?.isProfileSetupInitially
        ? "User already registered and profile is setup too"
        : "User already registered but profile is not setup",
    });
  }
});

router.post("/update-profile", async (req, res) => {
  const { user } = req.body;
  const id = user.id;
  const status = await storeDataInDatabase(
    { id, profile: user },
    DB_COLLECTIONS.users,
    id
  );
  if (status) {
    res
      .status(200)
      .json({ success: true, message: "Successfully updated profile data" });
  } else {
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile data" });
  }
});

router.get("/users-list", async (req, res) => {
  try {
    const users = await getAllDocumentsFromCollection(DB_COLLECTIONS.users);
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, users: [] });
  }
});

router.post("/likedMe-list", async (req, res) => {
  try {
    const { id } = req.body;
    const likedMeList = await getLikedMeProfiles(id);
    res.status(200).json({ success: true, likedMeList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, likedMeList: [] });
  }
});

router.post("/add-favorite", async (req, res) => {
  try {
    const { currentUserId, favoriteUsers } = req.body;
    const dataToStore = { user: currentUserId, favoriteUsers };
    await storeDataInDatabase(
      dataToStore,
      DB_COLLECTIONS.favorites,
      currentUserId
    );
    res.status(200).json({ success: true, favoriteUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, favoriteUsers: [] });
  }
});

router.post("/favorites-list", async (req, res) => {
  try {
    const { id } = req.body;
    const data = await getDataFromDatabase(DB_COLLECTIONS.favorites, id);
    res.status(200).json({ success: true, favoriteUsers: data?.favoriteUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, favoriteUsers: [] });
  }
});

router.post("/chat-list", async (req, res) => {
  try {
    const { id } = req.body;
    const data = await getDataFromDatabase(DB_COLLECTIONS.favorites, id);
    const favUsers = data?.favoriteUsers || [];
    const chatList = await Promise.all(
      favUsers.map(async (favUser) => {
        const response = await getDataFromDatabase(
          DB_COLLECTIONS.favorites,
          favUser
        );
        if (response && includes(response?.favoriteUsers, id)) {
          const userProfile = await getDataFromDatabase(
            DB_COLLECTIONS.users,
            favUser
          );
          return userProfile.profile;
        }
        return null;
      })
    );
    res.status(200).json({ success: true, chatList: compact(chatList) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, chatList: [] });
  }
});

router.post("/send-message", async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      message: { text, time, seen },
    } = req.body;

    // Find or create a chat and get the chat ID
    const chatId = await findOrCreateChat(senderId, receiverId);

    // Store the message
    const success = await storeMessage({ text, time, seen, senderId, chatId });

    // Respond to the client
    res.status(200).json({ success });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: error.message });
  }
});

router.post("/messages-list", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const chatData = await getDataFromDatabase(DB_COLLECTIONS.chats, "", [
      ["participants", "array-contains-any", [senderId, receiverId]],
    ]);

    if (!chatData || chatData.length === 0) {
      return res.status(200).json({ success: true, messagesList: [] });
    }

    const messages = await getDataFromDatabase(DB_COLLECTIONS.messages, "", [
      ["chatId", "==", chatData[0].id],
    ]);

    res.status(200).json({
      success: true,
      messagesList: messages || [],
    });
  } catch (error) {
    console.error("Error fetching messages list:", error);
    res.status(500).json({ success: false, messagesList: [] });
  }
});

router.post("/attribute-counts", async (req, res) => {
  const { id } = req.body;
  const stats = { total: 0, likes: 0, favorites: 0 };
  try {
    const totalUsers = await countDocumentsInCollection(DB_COLLECTIONS.users);
    const favorites = await getDataFromDatabase(DB_COLLECTIONS.favorites, id);
    const likedMeList = await getLikedMeProfiles(id);
    const totalLikes = likedMeList?.length || 0;
    res.status(200).json({
      counts: {
        total: totalUsers,
        likes: totalLikes,
        favorites: favorites?.favoriteUsers?.length || 0,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      counts: stats,
    });
  }
});

module.exports = router;
