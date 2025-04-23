import { useState, useEffect } from "react";

/**
 * A hook that delays updating a value until after a specified delay,
 * useful for reducing API calls or expensive operations on rapidly changing values.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds before the value is updated
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay is reached
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}