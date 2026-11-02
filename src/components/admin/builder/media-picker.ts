import { createContext, useContext } from "react";

export type PickedImage = { url: string; alt: string };

/** Opens the builder's image library; the callback receives the chosen image. */
export const MediaPickerContext = createContext<(onPick: (image: PickedImage) => void) => void>(
  () => {},
);

export const useMediaPicker = () => useContext(MediaPickerContext);
