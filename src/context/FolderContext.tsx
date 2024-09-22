import React, { createContext, useContext, useState } from 'react';

interface FolderContextType {
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolderContext = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolderContext must be used within a FolderProvider');
  }
  return context;
}

export const FolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  return (
    <FolderContext.Provider value={{ currentFolderId, setCurrentFolderId }}>
      {children}
    </FolderContext.Provider>
  );
};
