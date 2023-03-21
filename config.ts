export const FIRST_COOLDOWN = 35000;
export const NEXT_COOLDOWN = 6000;

let isProcessing: boolean = false;
let pendingCount: number = 0;

export const getProcessingStatus = () => isProcessing;
export const setProcessingStatus = (s: boolean) => (isProcessing = s);
export const getPendingCount = () => pendingCount;
export const decreasePendingCount = () =>
  (pendingCount = pendingCount - 1 < 0 ? 0 : pendingCount - 1);
export const increasePendingCount = () => pendingCount++;
export const resetPendingCount = () => (pendingCount = 0);
