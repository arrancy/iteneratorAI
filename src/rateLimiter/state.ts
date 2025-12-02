// harcodinng for now
type UserToken = string;
const token1 = "token1";
const token2 = "token2";
const token3 = "token3";
const token4 = "token4";

const tokenBucket = [token1, token2, token3, token4];
const currentUsers = [];
export const waitingArray: UserToken[] = [];

export const areYouAllowed = (userToken: string) => {
  if (waitingArray.includes(userToken)) return false;
  if (tokenBucket.length >= 1) {
    currentUsers.push({ user: userToken, token: tokenBucket.pop() });
    return tokenBucket.pop();
  } else {
    waitingArray.push(userToken);
    return false;
  }
};
