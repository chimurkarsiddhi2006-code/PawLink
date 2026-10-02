import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// ==========================================
// PAWLINK ROLES
// ==========================================

const VALID_ROLES = [
  "citizen",
  "vet",
  "ngo",
  "shelter",
  "pharmacy",
  "authority"
];


// ==========================================
// MESSAGE HELPER
// ==========================================

function setMessage(message, type = "error") {

  const messageBox =
    document.querySelector("[data-auth-message]") ||
    document.querySelector(".auth-message") ||
    document.querySelector("#authMessage") ||
    document.querySelector("#loginMessage");

  if (!messageBox) {
    console.log(message);
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
}


// ==========================================
// FIREBASE ERROR MESSAGE
// ==========================================

function readableError(error) {

  const code = error?.code || "";

  switch (code) {

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/missing-password":
      return "Please enter your password.";

    case "auth/weak-password":
      return "Password should contain at least 6 characters.";

    case "auth/email-already-in-use":
      return "This email is already registered.";

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/user-not-found":
      return "No account exists with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "permission-denied":
      return "Missing or insufficient permissions.";

    default:
      return error?.message ||
        "Something went wrong. Please try again.";
  }
}


// ==========================================
// LOAD USER PROFILE
// ==========================================

async function loadProfile(user) {

  if (!user) {
    return null;
  }

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);


  if (!userSnap.exists()) {

    console.warn(
      "No Firestore profile found for:",
      user.uid
    );

    // Safe fallback
    return {

      uid: user.uid,

      name:
        user.displayName ||
        "PawLink User",

      email:
        user.email || "",

      role:
        "citizen",

      city:
        "",

      status:
        "active"

    };
  }


  return {

    uid: user.uid,

    ...userSnap.data()

  };
}


// ==========================================
// GET DASHBOARD URL
// ==========================================

function getDashboardUrl(profile) {

  const role =
    VALID_ROLES.includes(profile?.role)
      ? profile.role
      : "citizen";


  const city =
    encodeURIComponent(
      profile?.city || ""
    );


  return `role.html?role=${role}&city=${city}`;
}


// ==========================================
// REGISTER
// ==========================================

async function register({
  name,
  email,
  password,
  city,
  requestedRole = "citizen"
}) {

  try {

    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!name || !email || !password) {

      throw new Error(
        "Please fill all required fields."
      );

    }


    if (password.length < 6) {

      throw new Error(
        "Password should contain at least 6 characters."
      );

    }


    // Make sure selected role is valid

    if (!VALID_ROLES.includes(requestedRole)) {

      requestedRole = "citizen";

    }


    // --------------------------------------
    // CREATE FIREBASE AUTH ACCOUNT
    // --------------------------------------

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    // --------------------------------------
    // SAVE DISPLAY NAME
    // --------------------------------------

    await updateProfile(user, {

      displayName: name

    });


    // --------------------------------------
    // CREATE FIRESTORE PROFILE
    // --------------------------------------
    //
    // The selected role becomes the user's
    // dashboard role.
    //
    // Example:
    //
    // Citizen  -> citizen
    // NGO      -> ngo
    // Vet      -> vet
    // Shelter  -> shelter
    // Pharmacy -> pharmacy
    // Authority-> authority
    //

    const profile = {

      uid:
        user.uid,

      name:
        name,

      email:
        email,

      city:
        city || "",

      role:
        requestedRole,

      requestedRole:
        requestedRole,

      status:
        "active",

      createdAt:
        serverTimestamp()

    };


    // Save profile

    await setDoc(
      doc(db, "users", user.uid),
      profile
    );


    // --------------------------------------
    // SUCCESS MESSAGE
    // --------------------------------------

    setMessage(
      "Account created successfully!",
      "success"
    );


    console.log(
      "Registered user:",
      profile
    );


    // --------------------------------------
    // REDIRECT TO CORRECT DASHBOARD
    // --------------------------------------

    window.location.href =
      getDashboardUrl(profile);

  }

  catch (error) {

    console.error(
      "Registration error:",
      error
    );


    setMessage(
      readableError(error),
      "error"
    );


    // Let app.js know registration failed

    throw error;

  }

}


// ==========================================
// LOGIN
// ==========================================

async function signIn(email, password) {

  try {

    if (!email || !password) {

      throw new Error(
        "Please enter email and password."
      );

    }


    // --------------------------------------
    // FIREBASE LOGIN
    // --------------------------------------

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      userCredential.user;


    console.log(
      "Firebase login successful:",
      user.email
    );


    // --------------------------------------
    // LOAD FIRESTORE PROFILE
    // --------------------------------------

    const profile =
      await loadProfile(user);


    console.log(
      "Logged-in profile:",
      profile
    );


    // --------------------------------------
    // ROLE-BASED REDIRECT
    // --------------------------------------

    const dashboardUrl =
      getDashboardUrl(profile);


    console.log(
      "Redirecting to:",
      dashboardUrl
    );


    window.location.href =
      dashboardUrl;

  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );


    setMessage(
      readableError(error),
      "error"
    );


    throw error;

  }

}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

  try {

    await signOut(auth);


    console.log(
      "User logged out successfully."
    );


    window.location.href =
      "index.html";

  }

  catch (error) {

    console.error(
      "Logout error:",
      error
    );


    throw error;

  }

}


// ==========================================
// CREATE ANIMAL CASE
// ==========================================

async function createCase(caseData) {

  const user =
    auth.currentUser;


  if (!user) {

    throw new Error(
      "Please login before submitting a report."
    );

  }


  // Generate case reference

  const reference =
    "PL-" +
    Date.now()
      .toString()
      .slice(-8);


  const newCase = {

    reference:
      reference,

    ...caseData,

    reporterId:
      user.uid,

    reporterName:
      user.displayName ||
      "PawLink User",

    reporterEmail:
      user.email ||
      "",

    status:
      "Reported",

    createdAt:
      serverTimestamp()

  };


  // Save case in Firestore

  const caseRef =
    await addDoc(
      collection(db, "cases"),
      newCase
    );


  console.log(
    "Case created:",
    caseRef.id
  );


  return {

    id:
      caseRef.id,

    reference:
      reference

  };

}


// ==========================================
// STABLE PAWLINK AUTH OBJECT
// ==========================================

window.PawLinkAuth = {

  user:
    null,

  profile:
    null,

  register:
    register,

  signIn:
    signIn,

  signOut:
    logout

};


// ==========================================
// CASE API
// ==========================================

window.PawLinkCases = {

  create:
    createCase

};


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      console.log(
        "Firebase user logged in:",
        user.email
      );


      try {

        const profile =
          await loadProfile(user);


        // Update only user/profile.
        // Do NOT replace PawLinkAuth.

        window.PawLinkAuth.user =
          user;


        window.PawLinkAuth.profile =
          profile;


        console.log(
          "PawLink profile loaded:",
          profile
        );

      }

      catch (error) {

        console.error(
          "Could not load user profile:",
          error
        );


        window.PawLinkAuth.user =
          user;


        window.PawLinkAuth.profile =
          null;

      }

    }

    else {

      console.log(
        "No user currently logged in."
      );


      window.PawLinkAuth.user =
        null;


      window.PawLinkAuth.profile =
        null;

    }


    // Tell app.js Firebase is ready

    window.dispatchEvent(
      new CustomEvent(
        "pawlink:auth-ready"
      )
    );

  }
);


// ==========================================
// FIREBASE READY FLAG
// ==========================================

window.PawLinkFirebase = {

  app:
    app,

  auth:
    auth,

  db:
    db,

  ready:
    true

};


console.log(
  "PawLink Firebase initialized successfully."
);