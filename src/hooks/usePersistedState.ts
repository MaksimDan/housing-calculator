// File: src/hooks/usePersistedState.ts
import { useState, useEffect, useCallback } from "react";
import { getBrowserStorage, readPersisted, writePersisted, removePersisted } from "../lib/inputValidation";

// Only values that differ from the default are stored, so a later change to a
// default reaches every visitor who never edited that field. `sanitize`
// returns a valid value or undefined to reject one (invalid saved values fall
// back to the default; invalid updates are ignored).
export const usePersistedState = <T,>(
    key: string,
    defaultValue: T,
    sanitize: (raw: unknown) => T | undefined = (raw) => raw as T
): [T, (value: T | ((prev: T) => T)) => void] => {
    const [value, setValue] = useState<T>(() => {
        const stored = readPersisted(getBrowserStorage(), key);
        if (stored === undefined) return defaultValue;
        const clean = sanitize(stored);
        return clean === undefined ? defaultValue : clean;
    });

    useEffect(() => {
        const storage = getBrowserStorage();
        if (Object.is(value, defaultValue)) {
            removePersisted(storage, key);
        } else {
            writePersisted(storage, key, value);
        }
    }, [key, value, defaultValue]);

    const setSanitized = useCallback((next: T | ((prev: T) => T)) => {
        setValue(prev => {
            const candidate = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
            const clean = sanitize(candidate);
            return clean === undefined ? prev : clean;
        });
    // sanitize is expected to be stable (module-level function)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [value, setSanitized];
};
