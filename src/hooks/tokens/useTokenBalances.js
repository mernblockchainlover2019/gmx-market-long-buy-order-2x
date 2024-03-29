import Multicall from "abis/Multicall.json";
import Token from "abis/Token.json";
import { getContract } from "config/contracts";
import { getV2Tokens, NATIVE_TOKEN_ADDRESS } from "config/tokens";
import { useMulticall } from "hooks/multicall";
import { BigNumber } from "ethers";
import useWallet from "hooks/wallet/useWallet";


export function useTokenBalances(chainId, overrideAccount) {
  const { account: currentAccount } = useWallet();
  const account = overrideAccount ?? currentAccount;

  const { data } = useMulticall(chainId, "useTokenBalances", {
    key: account ? [account] : null,
    request: () =>
      getV2Tokens(chainId).reduce((acc, token) => {
        // Skip synthetic tokens
        if (token.isSynthetic) return acc;

        const address = token.address;

        if (address === NATIVE_TOKEN_ADDRESS) {
          acc[address] = {
            contractAddress: getContract(chainId, "Multicall"),
            abi: Multicall.abi,
            calls: {
              balance: {
                methodName: "getEthBalance",
                params: [account],
              },
            },
          };
        } else {
          acc[address] = {
            contractAddress: address,
            abi: Token.abi,
            calls: {
              balance: {
                methodName: "balanceOf",
                params: [account],
              },
            },
          };
        }

        return acc;
      }, {}),
    parseResponse: (res) =>
      Object.keys(res.data).reduce((tokenBalances, tokenAddress) => {
        tokenBalances[tokenAddress] = BigNumber.from(res.data[tokenAddress].balance.returnValues[0]);

        return tokenBalances;
      }, {}),
  });

  return {
    balancesData: data,
  };
}
