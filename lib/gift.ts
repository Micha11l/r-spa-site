export function generateGiftCode() {
    const s = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,4);
    return `RJ-${s()}-${s()}`;
  }