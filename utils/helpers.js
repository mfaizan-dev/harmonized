const { compact } = require("lodash");
const {
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} = require("../firebase");
const { DB_COLLECTIONS } = require("../utils/constants");
const { faker } = require("@faker-js/faker");
const { includes } = require("lodash");

const storeDataInDatabase = async (data, collectionName, documentId) => {
  try {
    await setDoc(doc(db, collectionName, documentId), data);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getDataFromDatabase = async (
  collectionName,
  documentId,
  filters = null
) => {
  try {
    if (filters === null) {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } else {
      const collectionRef = collection(db, collectionName);

      // Apply multiple filters if provided
      let queryRef = collectionRef;
      filters.forEach((filter) => {
        queryRef = query(queryRef, where(...filter));
      });

      const querySnapshot = await getDocs(queryRef);

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map((doc) => doc.data());
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getAllDocumentsFromCollection = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push(doc.data()); // Only include document data
    });

    return documents;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const countDocumentsInCollection = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const documentCount = querySnapshot.size;
    return documentCount;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const findOrCreateChat = async (senderId, receiverId) => {
  // Find chat document by participants
  const chatData = await getDataFromDatabase(DB_COLLECTIONS.chats, "", [
    ["participants", "array-contains-any", [senderId, receiverId]],
  ]);

  if (!chatData) {
    // If no chat exists, create a new chat
    const newChat = {
      id: generateUUID(),
      participants: [senderId, receiverId],
      createdAt: new Date().toISOString(), // Use ISO string for timestamps
    };
    const success = await storeDataInDatabase(
      newChat,
      DB_COLLECTIONS.chats,
      newChat.id
    );

    if (!success) {
      throw new Error("Error in initiating chat");
    }

    return newChat.id;
  } else {
    return chatData[0]?.id;
  }
};

const generateUUID = () => faker.string.uuid();

const storeMessage = async ({ text, time, seen, senderId, chatId }) => {
  const msgId = generateUUID();
  const message = {
    msgId,
    text,
    time,
    seen,
    senderId,
    chatId,
  };
  return await storeDataInDatabase(message, DB_COLLECTIONS.messages, msgId);
};

const getLikedMeProfiles = async (id) => {
  const favoritesDocs = await getAllDocumentsFromCollection(
    DB_COLLECTIONS.favorites
  );
  const likedMeList = await Promise.all(
    favoritesDocs.map(async (doc) => {
      if (includes(doc?.favoriteUsers, id)) {
        const userProfile = await getDataFromDatabase(
          DB_COLLECTIONS.users,
          doc?.user
        );
        return userProfile;
      }
    })
  );
  return compact(likedMeList);
};

module.exports = {
  storeDataInDatabase,
  getDataFromDatabase,
  getAllDocumentsFromCollection,
  findOrCreateChat,
  storeMessage,
  getLikedMeProfiles,
  countDocumentsInCollection,
};
