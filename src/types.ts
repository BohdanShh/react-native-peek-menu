export type PeekMenuItem = {
  title: string;
  onPress: () => void;
  destructive?: boolean;
};

export type PeekMenuRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PeekMenuInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
