import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || false
}

const userSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            localStorage.setItem("user", JSON.stringify(action.payload))
            state.user = action.payload
        },
        logout: (state) => {
            localStorage.removeItem("user")
            state.user = false
        }
    },

})

export const { login, logout } = userSlice.actions

export default userSlice.reducer