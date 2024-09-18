import { useState } from "react";

interface Disclosure<T = undefined> {
  open: boolean;
  data: T | null;
  onOpen: (data?: T) => void;
  onClose: () => void;
}

export default function useDisclosure<T = undefined>(): Disclosure<T> {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const onOpen = (data?: T) => {
    setData(data || null);
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
    setData(null);
  };

  return { open, data, onOpen, onClose };
}
