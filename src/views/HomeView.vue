<script setup>
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import ExpansionSection from '../components/ExpansionSection.vue';
import DutyModal from '../components/DutyModal.vue';
import dutiesData from '../assets/duties.json';

const completedDuties = useStorage('ffxiv-completed-duties', {});

const toggleDuty = (dutyId) => {
  if (completedDuties.value[dutyId]) {
    delete completedDuties.value[dutyId];
  } else {
    completedDuties.value[dutyId] = true;
  }
};

const typeTabs = [
  { id: 'Dungeon', name: 'DONJONS' },
  { id: 'Trial', name: 'DÉFIS' },
  { id: 'Raid8', name: 'RAIDS 8' },
  { id: 'Raid24', name: 'RAIDS 24' },
  { id: 'Extra', name: 'EXTRA' },
];

const expansionTabs = [
  { id: 0, name: 'A Realm Reborn', color: 'var(--exp-arr)' },
  { id: 1, name: 'Heavensward', color: 'var(--exp-hw)' },
  { id: 2, name: 'Stormblood', color: 'var(--exp-sb)' },
  { id: 3, name: 'Shadowbringers', color: 'var(--exp-shb)' },
  { id: 4, name: 'Endwalker', color: 'var(--exp-ew)' },
  { id: 5, name: 'Dawntrail', color: 'var(--exp-dt)' },
];

const selectedTypeId = ref(null);
const selectedExpansionId = ref(null);
const selectedDutyModal = ref(null);

const toggleType = (id) => {
  selectedTypeId.value = selectedTypeId.value === id ? null : id;
};

const toggleExpansion = (id) => {
  selectedExpansionId.value = selectedExpansionId.value === id ? null : id;
};

// Group duties by expansion -> difficulty
const expansions = computed(() => {
  const groups = {};
  
  const difficultyOrder = {
    'NORMAUX': 1,
    'BRUTAL': 2,
    'EXTRÊME': 3,
    'SADIQUE': 4,
    'FATAL': 5,
    'CHAOS': 6,
    'Donjons sans fond': 10,
    'Missions d\'exploration': 11,
    'Donjons à embranchements': 12,
    'Donjons alternatifs': 13,
    'Quêtes tribales': 14,
    'Guide détaillé': 15
  };
  
  dutiesData
    .filter(duty => {
      const typeMatch = selectedTypeId.value === null || duty.type === selectedTypeId.value;
      const expMatch = selectedExpansionId.value === null || duty.expansionId === selectedExpansionId.value;
      return typeMatch && expMatch;
    })
    .forEach(duty => {
      if (!groups[duty.expansionName]) {
        groups[duty.expansionName] = {
          name: duty.expansionName,
          id: duty.expansionId,
          difficulties: {}
        };
      }
      
      const expGroup = groups[duty.expansionName];
      if (!expGroup.difficulties[duty.difficulty]) {
        expGroup.difficulties[duty.difficulty] = {
          name: duty.difficulty,
          sortWeight: difficultyOrder[duty.difficulty] || 99,
          duties: []
        };
      }
      
      expGroup.difficulties[duty.difficulty].duties.push(duty);
    });
    
  return Object.values(groups)
    .map(exp => {
      exp.difficultyGroups = Object.values(exp.difficulties).sort((a, b) => a.sortWeight - b.sortWeight);
      return exp;
    })
    .sort((a, b) => a.id - b.id);
});
</script>

<template>
  <div class="header">
    <div class="header-content">
      <h1>Contenus d'Éorzéa</h1>
    </div>
    <p>Une collection complète de vos missions classées par extension.</p>
  </div>
  
  <div class="filters-container">
    <div class="tabs primary-tabs">
      <button 
        v-for="tab in typeTabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ 'active': selectedTypeId === tab.id }"
        @click="toggleType(tab.id)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="tabs secondary-tabs">
      <button 
        v-for="exp in expansionTabs" 
        :key="exp.id"
        class="chip-btn"
        :class="{ 'active': selectedExpansionId === exp.id }"
        :style="{ '--chip-color': exp.color }"
        @click="toggleExpansion(exp.id)"
      >
        {{ exp.name }}
      </button>
    </div>
  </div>
  
  <TransitionGroup name="fade" tag="div" class="content-wrapper">
    <ExpansionSection 
      v-for="exp in expansions" 
      :key="exp.id + String(selectedTypeId) + String(selectedExpansionId)"
      :expansionName="exp.name"
      :expansionId="exp.id"
      :difficultyGroups="exp.difficultyGroups"
      :completedDuties="completedDuties"
      @toggle-duty="toggleDuty"
      @open-modal="duty => selectedDutyModal = duty"
    />
  </TransitionGroup>
  
  <div v-if="expansions.length === 0" class="empty-state">
    <p>Aucune mission trouvée pour ces critères.</p>
  </div>
  
  <DutyModal 
    v-if="selectedDutyModal" 
    :duty="selectedDutyModal" 
    @close="selectedDutyModal = null" 
  />
</template>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
