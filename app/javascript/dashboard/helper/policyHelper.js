import { PREMIUM_FEATURES } from 'dashboard/featureFlags';
import { INSTALLATION_TYPES } from 'dashboard/constants/installationTypes';
import { hasPermissions } from './permissionsHelper';

export const isPremiumFeature = featureFlag => {
  if (!featureFlag) return false;
  return PREMIUM_FEATURES.includes(featureFlag);
};

export const checkInstallationType = (
  config,
  { isEnterprise, isOnChatwootCloud }
) => {
  if (Array.isArray(config) && config.length > 0) {
    const installationCheck = {
      [INSTALLATION_TYPES.ENTERPRISE]: isEnterprise,
      [INSTALLATION_TYPES.CLOUD]: isOnChatwootCloud,
      [INSTALLATION_TYPES.COMMUNITY]: true,
    };

    return config.some(type => installationCheck[type]);
  }

  return true;
};

export const evaluatePolicy = ({
  featureFlag = '',
  permissions = [],
  installationTypes = [],
  userPermissions = [],
  isFeatureEnabledOnAccount = () => true,
  isOnChatwootCloud = false,
  isACustomBrandedInstance = false,
  isEnterprise = false,
}) => {
  if (!hasPermissions(permissions, userPermissions)) return false;
  if (
    !checkInstallationType(installationTypes, {
      isEnterprise,
      isOnChatwootCloud,
    })
  ) {
    return false;
  }

  const flag = featureFlag || '';

  // Routes without a feature flag are accessible once permissions/installation pass
  if (!flag) {
    return true;
  }

  if (isACustomBrandedInstance) {
    return isFeatureEnabledOnAccount(flag);
  }

  if (isOnChatwootCloud) {
    return (
      isFeatureEnabledOnAccount(flag) || isPremiumFeature(flag)
    );
  }

  // Self-hosted: only show features explicitly enabled on the account
  return isFeatureEnabledOnAccount(flag);
};

export const evaluatePaywallVisibility = ({
  featureFlag = '',
  isFeatureEnabledOnAccount = () => true,
  isOnChatwootCloud = false,
  isACustomBrandedInstance = false,
}) => {
  const flag = featureFlag || '';
  if (!flag) return false;

  if (isACustomBrandedInstance) return false;

  if (isOnChatwootCloud) {
    return isPremiumFeature(flag) && !isFeatureEnabledOnAccount(flag);
  }

  return false;
};

export const resolveRoutePolicyMeta = (to, getRoutes) => {
  if (to.params?.navigationPath) {
    const targetRoute = getRoutes().find(
      route => route.name === to.params.navigationPath
    );

    if (targetRoute?.meta) {
      return {
        featureFlag: targetRoute.meta.featureFlag || '',
        permissions: targetRoute.meta.permissions || [],
        installationTypes: targetRoute.meta.installationTypes || [],
      };
    }
  }

  const matched = to.matched?.[to.matched.length - 1];

  return {
    featureFlag: matched?.meta?.featureFlag || to.meta?.featureFlag || '',
    permissions: matched?.meta?.permissions || to.meta?.permissions || [],
    installationTypes:
      matched?.meta?.installationTypes || to.meta?.installationTypes || [],
  };
};
