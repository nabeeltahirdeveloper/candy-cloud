import { configureStore } from "@reduxjs/toolkit";
import GlobalReducer from "./slices/GlobalSlice";
import userSlice from "./slices/userSlice";
import starredSlice from "./slices/starredSlice";
import workspaceSlice from "./slices/workspace";
import folderReducer from './slices/folderSlice';  // Import the folder reducer

export const store = configureStore({
  reducer: {
    GlobalReducer,
    user: userSlice,
    starred: starredSlice,
    workspace: workspaceSlice,
    folder: folderReducer,  // Add the folder reducer here
    // userInfo:
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
