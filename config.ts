export const FIRST_COOLDOWN = 35000;
export const NEXT_COOLDOWN = 10000;
export const CLEAR_COOLDOWN = 13000;
export const REFUND_TIMEOUT = 240000;

/// working as mutex for creating & setting winner conflicts
let isProcessing: boolean = false;
/// save process requested time to ignore mutex if Tx finalized time expired
let lastRequestedTime: number = Date.now();
/// await setting winner if there are pending enter Transactions
let pendingCount: number = 0;
/// max await time for transaction confirmation
const MAX_PENDING_AWAIT_TIME = 15000;

export const getProcessingStatus = () => {
  // reset request processing false if max pending time passed
  if (Date.now() - lastRequestedTime > MAX_PENDING_AWAIT_TIME)
    isProcessing = false;
  return isProcessing;
};
export const setProcessingStatus = (s: boolean) => {
  isProcessing = s;
  // save process requested time
  lastRequestedTime = Date.now();
};

export const getPendingCount = () => {
  // reset request processing false if max pending time passed
  if (Date.now() - lastRequestedTime > MAX_PENDING_AWAIT_TIME) pendingCount = 0;
  return pendingCount;
};
export const decreasePendingCount = () =>
  (pendingCount = pendingCount - 1 < 0 ? 0 : pendingCount - 1);
export const increasePendingCount = () => {
  pendingCount++;
  // save process requested time
  lastRequestedTime = Date.now();
};
export const resetPendingCount = () => (pendingCount = 0);
