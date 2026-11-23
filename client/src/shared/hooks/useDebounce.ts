import { useDebounce as useDebounceHook } from "use-debounce";

/**
 * Modern debounce hook powered by the standard `use-debounce` library.
 * Returns the debounced value after delayMs milliseconds of inactivity.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced] = useDebounceHook(value, delayMs);
  return debounced;
}
