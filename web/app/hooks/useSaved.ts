import { useEffect, useState } from "react";

export default function useSaved<T>(defaultValue: T, key: string) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let s = localStorage.getItem(key);
    if (s) setValue(JSON.parse(s));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, loaded]);
  return [value, setValue, loaded] as const;
}
