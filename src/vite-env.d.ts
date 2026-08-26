/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  kakao: {
    Postcode: new (options: {
      width?: number;
      height?: number;
      oncomplete: (data: {
        zonecode: string;
        userSelectedType: "R" | "J";
        roadAddress: string;
        jibunAddress: string;
      }) => void;
    }) => {
      open: (options?: { left?: number; top?: number }) => void;
      embed: (element: HTMLElement) => void;
    };
  };
}
