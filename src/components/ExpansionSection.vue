<script setup>
import DutyCard from './DutyCard.vue';

const props = defineProps({
  expansionName: {
    type: String,
    required: true
  },
  expansionId: {
    type: Number,
    required: true
  },
  difficultyGroups: {
    type: Array,
    required: true
  },
  completedDuties: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-duty', 'open-modal']);

const colors = {
  0: 'var(--exp-arr)',
  1: 'var(--exp-hw)',
  2: 'var(--exp-sb)',
  3: 'var(--exp-shb)',
  4: 'var(--exp-ew)',
  5: 'var(--exp-dt)'
};

const titleColor = colors[props.expansionId] || 'var(--text-primary)';
</script>

<template>
  <div class="expansion-container">
    <div class="expansion-header" :style="{ color: titleColor }">
      <h2>{{ expansionName }}</h2>
    </div>
    
    <div v-for="group in difficultyGroups" :key="group.name" class="difficulty-section">
      <h3 class="difficulty-title" :style="{ color: titleColor }">{{ group.name }}</h3>
      <div class="duty-grid">
        <DutyCard 
          v-for="duty in group.duties" 
          :key="duty.id" 
          :duty="duty" 
          :color="titleColor"
          :is-completed="!!completedDuties[duty.id]"
          @toggle-completion="emit('toggle-duty', duty.id)"
          @open-modal="d => emit('open-modal', d)"
        />
      </div>
    </div>
  </div>
</template>
