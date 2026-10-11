// Page-local memory: another tab must not change the account this page expects.
let activeAccount: string | null = null;
export function setSessionAccount(id: string | null) { activeAccount = id; }
export function sessionHeaders(): Record<string, string> {
  return activeAccount ? { 'x-java-forge-account': activeAccount } : {};
}
