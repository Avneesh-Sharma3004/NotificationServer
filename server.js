// const express = require("express");
// const cors = require("cors");

// const { initializeApp, cert } = require("firebase-admin/app");
// const { getFirestore } = require("firebase-admin/firestore");

// const serviceAccount = require("./chat-app-1f6bf-firebase-adminsdk-fbsvc-c4299c5072.json");

// initializeApp({
//   credential: cert(serviceAccount),
// });

// const db = getFirestore();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // ------------------------------------
// // Firestore Message Listener
// // ------------------------------------

// const messagesRef = db.collectionGroup("messages");

// messagesRef.onSnapshot(
//   (snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       if (change.type !== "added") {
//         return;
//       }

//       const handleNewMessage = async () => {
//         try {
//           const message = change.doc.data();

//           const messageId = change.doc.id;

//           const conversationRef = change.doc.ref.parent.parent;

//           const conversationId = conversationRef ? conversationRef.id : null;

//           console.log("--------------------------------");
//           console.log("New message detected!");
//           console.log("Message ID:", messageId);
//           console.log("Conversation ID:", conversationId);
//           console.log("Sender ID:", message.senderId);
//           console.log("Receiver ID:", message.receiverId);
//           console.log("Message:", message.text);

//           const receiverDoc = await db
//             .collection("users")
//             .doc(message.receiverId)
//             .get();

//           if (!receiverDoc.exists) {
//             console.log("Receiver user not found");
//             return;
//           }

//           const receiverData = receiverDoc.data();

//           const pushToken = receiverData.pushToken;

//           console.log("Receiver Push Token:", pushToken);

//           console.log("--------------------------------");

//           if (!pushToken) {
//             console.log("Receiver has no push token");
//             return;
//           }

//           await sendPushNotification({
//             pushToken,
//             title: receiverData.name || "New Message",
//             body: message.text,
//             data: {
//               type: "chat",
//               conversationId,
//               senderId: message.senderId,
//               receiverId: message.receiverId,
//             },
//           });
//         } catch (error) {
//           console.error("New message processing error:", error);
//         }
//       };

//       handleNewMessage();
//     });
//   },
//   (error) => {
//     console.error("Message listener error:", error);
//   },
// );

// const sendPushNotification = async ({ pushToken, title, body, data }) => {
//   try {
//     const response = await fetch("https://exp.host/--/api/v2/push/send", {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         to: pushToken,
//         title,
//         body,
//         data,
//         priority: "high",
//       }),
//     });

//     const result = await response.json();

//     console.log("Expo Push Response:", JSON.stringify(result, null, 2));

//     return result;
//   } catch (error) {
//     console.error("Push notification error:", error);

//     throw error;
//   }
// };

// // ------------------------------------
// // Test Route
// // ------------------------------------

// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Notification server is running",
//   });
// });

// // ------------------------------------
// // Firestore Test
// // ------------------------------------

// app.get("/test-firestore", async (req, res) => {
//   try {
//     const snapshot = await db.collection("users").limit(1).get();

//     res.json({
//       success: true,
//       firestoreConnected: true,
//       usersFound: snapshot.size,
//     });
//   } catch (error) {
//     console.error("Firestore error:", error);

//     res.status(500).json({
//       success: false,
//       firestoreConnected: false,
//       error: error.message,
//     });
//   }
// });

// // ------------------------------------
// // Start Server
// // ------------------------------------

// const PORT = process.env.PORT || 10000;

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();

const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------
// Send Push Notification
// ------------------------------------

const sendPushNotification = async ({ pushToken, title, body, data }) => {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        priority: "high",
      }),
    });

    const result = await response.json();

    console.log("Expo Push Response:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("Push notification error:", error);

    throw error;
  }
};

// ------------------------------------
// Firestore Message Listener
// ------------------------------------

const messagesRef = db.collectionGroup("messages");

let isInitialSnapshot = true;

messagesRef.onSnapshot(
  (snapshot) => {
    if (isInitialSnapshot) {
      isInitialSnapshot = false;
      console.log("Initial messages loaded. Notifications skipped.");
      return;
    }

    snapshot.docChanges().forEach((change) => {
      if (change.type !== "added") {
        return;
      }

      const handleNewMessage = async () => {
        try {
          const message = change.doc.data();

          const messageId = change.doc.id;

          const conversationRef = change.doc.ref.parent.parent;

          const conversationId = conversationRef ? conversationRef.id : null;

          // console.log("--------------------------------");
          // console.log("New message detected!");
          // console.log("Message ID:", messageId);
          // console.log("Conversation ID:", conversationId);
          // console.log("Sender ID:", message.senderId);
          // console.log("Receiver ID:", message.receiverId);
          // console.log("Message:", message.text);

          const receiverDoc = await db
            .collection("users")
            .doc(message.receiverId)
            .get();

          if (!receiverDoc.exists) {
            console.log("Receiver user not found");
            return;
          }

          const receiverData = receiverDoc.data();

          const pushToken = receiverData.pushToken;

          const activeConversationId = receiverData.activeConversationId;

          console.log("Receiver Push Token:", pushToken);
          console.log("Receiver Active Conversation:", activeConversationId);

          // ------------------------------------
          // Receiver already has this chat open
          // ------------------------------------

          if (activeConversationId === conversationId) {
            console.log(
              "Receiver is currently in this chat. Notification skipped.",
            );

            return;
          }

          // ------------------------------------
          // Receiver has no push token
          // ------------------------------------

          if (!pushToken) {
            console.log("Receiver has no push token");
            return;
          }

          await sendPushNotification({
            pushToken,
            title: receiverData.name || "New Message",

            body: message.text,

            data: {
              type: "chat",
              conversationId,
              senderId: message.senderId,
              receiverId: message.receiverId,
            },
          });

          console.log("Notification sent successfully");

          console.log("--------------------------------");
        } catch (error) {
          console.error("New message processing error:", error);
        }
      };

      handleNewMessage();
    });
  },
  (error) => {
    console.error("Message listener error:", error);
  },
);

// ------------------------------------
// Test Route
// ------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notification server is running",
  });
});

// ------------------------------------
// Firestore Test
// ------------------------------------

app.get("/test-firestore", async (req, res) => {
  try {
    const snapshot = await db.collection("users").limit(1).get();

    res.json({
      success: true,
      firestoreConnected: true,
      usersFound: snapshot.size,
    });
  } catch (error) {
    console.error("Firestore error:", error);

    res.status(500).json({
      success: false,
      firestoreConnected: false,
      error: error.message,
    });
  }
});

// ------------------------------------
// Start Server
// ------------------------------------

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
