// src/store/slices/folderSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface FolderState {
  currentFolderId: string | null;
}

const initialState: FolderState = {
  currentFolderId: null, // Initially no folder is selected
};

const folderSlice = createSlice({
  name: 'folder',
  initialState,
  reducers: {
    setCurrentFolder(state, action) {
      state.currentFolderId = action.payload; // Set the currently selected folder ID
    },
  },
});

export const { setCurrentFolder } = folderSlice.actions;
export default folderSlice.reducer;
