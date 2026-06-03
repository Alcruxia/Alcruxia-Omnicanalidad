import { unref } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';
import { useAccount } from 'dashboard/composables/useAccount';
import { useConfig } from 'dashboard/composables/useConfig';
import { getUserPermissions, hasPermissions } from 'dashboard/helper/permissionsHelper';
import {
  evaluatePolicy,
  evaluatePaywallVisibility,
  isPremiumFeature,
} from 'dashboard/helper/policyHelper';

export function usePolicy() {
  const user = useMapGetter('getCurrentUser');
  const isFeatureEnabled = useMapGetter('accounts/isFeatureEnabledonAccount');
  const isOnChatwootCloud = useMapGetter('globalConfig/isOnChatwootCloud');
  const isACustomBrandedInstance = useMapGetter(
    'globalConfig/isACustomBrandedInstance'
  );

  const { isEnterprise } = useConfig();
  const { accountId } = useAccount();

  const getUserPermissionsForAccount = () => {
    return getUserPermissions(user.value, accountId.value);
  };

  const isFeatureFlagEnabled = featureFlag => {
    if (!featureFlag) return true;
    return isFeatureEnabled.value(accountId.value, featureFlag);
  };

  const checkPermissions = requiredPermissions => {
    if (!requiredPermissions || !requiredPermissions.length) return true;
    const userPermissions = getUserPermissionsForAccount();
    return hasPermissions(requiredPermissions, userPermissions);
  };

  const policyContext = () => ({
    userPermissions: getUserPermissionsForAccount(),
    isFeatureEnabledOnAccount: flag => isFeatureFlagEnabled(flag),
    isOnChatwootCloud: isOnChatwootCloud.value,
    isACustomBrandedInstance: isACustomBrandedInstance.value,
    isEnterprise,
  });

  const shouldShow = (featureFlag, permissions, installationTypes) => {
    return evaluatePolicy({
      featureFlag: unref(featureFlag),
      permissions: unref(permissions),
      installationTypes: unref(installationTypes),
      ...policyContext(),
    });
  };

  const shouldShowPaywall = featureFlag => {
    return evaluatePaywallVisibility({
      featureFlag: unref(featureFlag),
      isFeatureEnabledOnAccount: flag => isFeatureFlagEnabled(flag),
      isOnChatwootCloud: isOnChatwootCloud.value,
      isACustomBrandedInstance: isACustomBrandedInstance.value,
    });
  };

  return {
    checkPermissions,
    shouldShowPaywall,
    isFeatureFlagEnabled,
    shouldShow,
    isPremiumFeature,
  };
}
