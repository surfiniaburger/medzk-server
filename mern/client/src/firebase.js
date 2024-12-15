import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendEmailVerification, updatePassword } from "firebase/auth";
import toast from "react-hot-toast";
import store from "./redux/store";
import { login as loginHandle, logout as logOutHandle } from "./redux/userSlice";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


 
const app = initializeApp(firebaseConfig);

export const auth = getAuth()


export const register = async (email, password) => {
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        toast.success("Account created successfully.")
        return user
    } catch (error) {
        toast.error(error.message)
    }
}

export const login = async (email, password) => {
    try {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        toast.success("Successfully logged in")
        return user
    } catch (error) {
        toast.error(error.message)
    }
}

export const logout = async () => {
    try {
        await signOut(auth)
        toast.success("Successfully logged out")
        return true
    } catch (error) {
        toast.error(error.message)
    }
}

export const update = async (data) => {
    try {
        await updateProfile(auth.currentUser, data)
        toast.success("Profile updated successfully")
        return true
    } catch (error) {
        toast.error(error.message)
    }
}

export const resetPassword = async (password) => {
    try {
        await updatePassword(auth.currentUser, password)
        toast.success("Your password has been updated")
        return true
    } catch (error) {
        toast.error(error.message)
    }
}

export const emailVerification = async () => {
    try {
        await sendEmailVerification(auth.currentUser)
        toast.success(`Verification email sent to ${auth.currentUser.email}. Please check your email.`)
    } catch (error) {
        toast.error(error.message)
    }
}



onAuthStateChanged(auth, (user) => {
    if (user) {
        store.dispatch(loginHandle({
            displayName: user.displayName,
            email: user.email,
            emailVerified: user.emailVerified,
            photoURL: user.photoURL,
            uid: user.uid


        }))
    } else {
        store.dispatch(logOutHandle())

    }
})






export default app;