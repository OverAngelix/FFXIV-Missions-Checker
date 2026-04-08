<script setup>
import { computed } from 'vue';

const props = defineProps({
  duty: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-completion', 'open-modal']);

const lodestoneUrl = computed(() => {
  if (props.duty.lodestone_info && props.duty.lodestone_info.trim() !== '') {
    return props.duty.lodestone_info;
  }
  return `https://fr.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${encodeURIComponent(props.duty.name)}`;
});
</script>

<template>
  <div class="duty-card" :class="{ 'is-completed': isCompleted }" :style="{ '--local-color': color }" @click="emit('open-modal', duty)">
    <div class="duty-card-bg" v-if="duty.lodestone_image" :style="{ backgroundImage: `url(${duty.lodestone_image})` }"></div>
    <div class="duty-card-header">
      <h3 class="duty-name">{{ duty.name }}</h3>
      <a :href="lodestoneUrl" target="_blank" rel="noopener noreferrer" @click.stop class="lodestone-btn" title="Voir sur The Lodestone">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
    <div class="duty-meta">
      <span v-if="duty.level && duty.level > 0" class="level-badge" :style="{ color: color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }">
        Niv. {{ duty.level }}
      </span>
      <button 
        class="completion-toggle" 
        :class="{ 'active': isCompleted }"
        @click.stop="emit('toggle-completion')"
        :title="isCompleted ? 'Marquer comme non terminé' : 'Marquer comme terminé'"
      >
        <svg v-if="isCompleted" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" class="empty-circle">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
        </svg>
      </button>
    </div>
  </div>
</template>
