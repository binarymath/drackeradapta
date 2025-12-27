export const safeLocalStorageGet = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('LocalStorage read failed:', e);
    return null;
  }
};

export const safeLocalStorageSet = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
};

export const safeLocalStorageRemove = (key) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('LocalStorage remove failed:', e);
  }
};

export const safeLocalStorageClear = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('LocalStorage clear failed:', e);
  }
};
