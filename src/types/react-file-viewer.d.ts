// src/@types/react-file-viewer.d.ts
declare module "react-file-viewer" {
  const FileViewer: React.ComponentType<{
    fileType: string;
    filePath: string;
    onError?: (e: any) => void;
  }>;
  export default FileViewer;
}
