// File: src/hooks/usePersistedState.ts
import { useState, useEffect } from "react";

export const usePersistedState = (key: string, defaultValue: any) => {
    const [value, setValue] = useState(() => {
        const persistedValue = localStorage.getItem(key);
        return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};