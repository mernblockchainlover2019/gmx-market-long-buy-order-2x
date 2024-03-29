import { getTokensMap, getV2Tokens } from "config/tokens";
import { useMemo } from "react";
import { useTokenBalances } from "./useTokenBalances";
import { useTokenRecentPrices } from "./useTokenRecentPricesData";

export function useTokensData(chainId) {
  const tokenConfigs = getTokensMap(chainId);
  const { balancesData } = useTokenBalances(chainId);
  const { pricesData, updatedAt: pricesUpdatedAt } = useTokenRecentPrices(chainId);

  return useMemo(() => {
    const tokenAddresses = getV2Tokens(chainId).map((token) => token.address);

    if (!pricesData) {
      return {
        tokensData: undefined,
        pricesUpdatedAt: undefined,
      };
    }

    return {
      tokensData: tokenAddresses.reduce((acc, tokenAddress) => {
        const prices = pricesData[tokenAddress];
        const balance = balancesData?.[tokenAddress];
        const tokenConfig = tokenConfigs[tokenAddress];

        if (!prices) {
          return acc;
        }

        acc[tokenAddress] = {
          ...tokenConfig,
          prices,
          balance,
        };
        return acc;
      }, {}),
      pricesUpdatedAt,
    };
  }, [chainId, pricesData, pricesUpdatedAt, balancesData, tokenConfigs]);
}
