import Token from "abis/Token.json";
import { NATIVE_TOKEN_ADDRESS } from "config/tokens";
import { useMulticall } from "hooks/multicall";
import { BigNumber } from "ethers";
import useWallet from "hooks/wallet/useWallet";

const defaultValue = {};

export function useTokensAllowanceData(
  chainId,
  p
) {
  const { spenderAddress, tokenAddresses } = p;
  const { account } = useWallet();

  const isNativeToken = tokenAddresses.length === 1 && tokenAddresses[0] === NATIVE_TOKEN_ADDRESS;

  const { data } = useMulticall(chainId, "useTokenAllowance", {
    key:
      !p.skip && account && spenderAddress && tokenAddresses.length > 0 && !isNativeToken
        ? [account, spenderAddress, tokenAddresses.join("-")]
        : null,

    request: () =>
      tokenAddresses
        .filter((address) => address !== NATIVE_TOKEN_ADDRESS)
        .reduce((contracts, address) => {
          contracts[address] = {
            contractAddress: address,
            abi: Token.abi,
            calls: {
              allowance: {
                methodName: "allowance",
                params: [account, spenderAddress],
              },
            },
          };

          return contracts;
        }, {}),

    parseResponse: (res) =>
      Object.keys(res.data).reduce((tokenAllowance, address) => {
        tokenAllowance[address] = BigNumber.from(res.data[address].allowance.returnValues[0]);

        return tokenAllowance;
      }, {}),
  });

  return {
    tokensAllowanceData: isNativeToken ? defaultValue : data,
  };
}
