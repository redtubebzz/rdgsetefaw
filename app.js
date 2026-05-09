import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZR5ZzTAyz4z_OVwP0OYn_mTitc8cip8g",
  authDomain: "chat-app-fbd13.firebaseapp.com",
  projectId: "chat-app-fbd13",
  storageBucket: "chat-app-fbd13.firebasestorage.app",
  messagingSenderId: "617245566128",
  appId: "1:617245566128:web:be6145ca605ea96b8b4775"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// UI FIXED (REAL IDS)
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");
const usersList = document.getElementById("usersList");

// STATE
let currentChat = null;

/* ---------------- SIGNUP FIX ---------------- */
document.getElementById("signupBtn").addEventListener("click", async () => {

  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const country = document.getElementById("country").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password || !name) {
    alert("Fill all fields");
    return;
  }

  try {

    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCred.user, {
      displayName: name
    });

    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      name,
      age,
      country,
      email
    });

    alert("Account Created ✔");

  } catch (e) {
    alert(e.message);
  }

});

/* ---------------- LOGIN FIX ---------------- */
document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);
    alert("Login Success ✔");

  } catch (e) {
    alert("Login Failed ❌");
  }

});

/* ---------------- AUTH STATE ---------------- */
onAuthStateChanged(auth, async (user) => {

  if (user) {

    authBox.style.display = "none";
    appBox.style.display = "block";

    const st = ref(rtdb, "status/" + user.uid);

    set(st, { state: "online", last: Date.now() });

    onDisconnect(st).set({ state: "offline", last: Date.now() });

    loadUsers();
    loadProfile(user.uid);

  } else {
    authBox.style.display = "block";
    appBox.style.display = "none";
  }

});

/* ---------------- PROFILE ---------------- */
async function loadProfile(uid) {

  const d = await getDoc(doc(db, "users", uid));
  const u = d.data();

  document.getElementById("pName").innerText = u.name;
  document.getElementById("pAge").innerText = u.age;
  document.getElementById("pCountry").innerText = u.country;
  document.getElementById("pEmail").innerText = u.email;

}

/* ---------------- USERS ---------------- */
async function loadUsers() {

  const snap = await getDocs(collection(db, "users"));

  usersList.innerHTML = "";

  snap.forEach(u => {

    const div = document.createElement("div");

    div.innerHTML = `
      <button onclick="openChat('${u.data().uid}','${u.data().name}')">
        ${u.data().name}
      </button>
      <hr>
    `;

    usersList.appendChild(div);

  });

}

/* ---------------- CHAT ---------------- */
window.openChat = function (uid, name) {

  currentChat = uid;

  document.getElementById("chatBox").style.display = "block";
  document.getElementById("chatTitle").innerText = name;

  const q = query(
    collection(db, "chats", auth.currentUser.uid + "_" + uid, "messages"),
    orderBy("time", "asc")
  );

  onSnapshot(q, (snap) => {

    const box = document.getElementById("messages");
    box.innerHTML = "";

    snap.forEach(m => {

      const d = m.data();

      box.innerHTML += `<p>${d.text}</p>`;

    });

  });

};

/* ---------------- SEND ---------------- */
document.getElementById("sendBtn").addEventListener("click", async () => {

  const text = document.getElementById("msgInput").value;

  await addDoc(
    collection(db, "chats", auth.currentUser.uid + "_" + currentChat, "messages"),
    {
      text,
      sender: auth.currentUser.uid,
      time: serverTimestamp()
    }
  );

  document.getElementById("msgInput").value = "";

});

/* ---------------- BACK ---------------- */
document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("chatBox").style.display = "none";
});

/* ---------------- LOGOUT ---------------- */
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});
