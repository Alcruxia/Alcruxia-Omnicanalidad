<script setup>
import { computed, useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');

const logoSrc = computed(() => {
  const { logoThumbnail, gitSha } = globalConfig.value || {};
  const src = logoThumbnail || '/brand-assets/logo_thumbnail.svg';

  return gitSha ? `${src}?v=${gitSha}` : src;
});
</script>

<template>
  <img
    v-bind="attrs"
    :src="logoSrc"
    :alt="globalConfig.installationName"
  />
</template>
