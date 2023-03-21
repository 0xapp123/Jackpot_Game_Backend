export const FIRST_COOLDOWN = 35000;
export const NEXT_COOLDOWN = 6000;

let isProcessing: boolean = false;
let pendingCount: number = 0;

export const getProcessingStatus = () => isProcessing;
export const setProcessingStatus = (s: boolean) => isProcessing = s;
export const getPendingCount = () => pendingCount;
export const setPendingCount = (cnt: number) => pendingCount = cnt;
