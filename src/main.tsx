import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./theme/theme.css";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { FolderProvider } from './context/FolderContext'; // Adjust the path as necessary

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
    <FolderProvider>
      <App />
    </FolderProvider>
    </Provider>
  </React.StrictMode>
);
