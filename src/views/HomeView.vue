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
const settingsOpen = ref(false);

const resetProgress = () => {
  if (confirm('Réinitialiser toute la progression ? Cette action est irréversible.')) {
    completedDuties.value = {};
    settingsOpen.value = false;
  }
};

const toggleType = (id) => {
  selectedTypeId.value = selectedTypeId.value === id ? null : id;
};

const toggleExpansion = (id) => {
  selectedExpansionId.value = selectedExpansionId.value === id ? null : id;
};

const totalDuties = computed(() => dutiesData.length);
const completedCount = computed(() => Object.keys(completedDuties.value).length);
const progressPercent = computed(() => Math.round((completedCount.value / totalDuties.value) * 100));

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
      <h2>Une collection complète de vos missions classées par extension</h2>
      <div class="settings-wrapper">
        <button class="settings-btn" @click="settingsOpen = !settingsOpen" title="Paramètres">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
        <div v-if="settingsOpen" class="settings-dropdown">
          <button class="settings-item danger" @click="resetProgress">
            Réinitialiser la progression
          </button>
        </div>
      </div>
    </div>
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

    <div class="progress-bar-container">
      <div class="progress-bar-header">
        <span>{{ completedCount }} / {{ totalDuties }} ({{ progressPercent }}%)</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
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
  justify-content: center;
  align-items: center;
  position: relative;
}

.settings-wrapper {
  position: absolute;
  right: 0;
}

.settings-btn {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.settings-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: #1a2235;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 0.4rem;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.settings-item {
  width: 100%;
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.settings-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.settings-item.danger {
  color: #ff6b6b;
}

.settings-item.danger:hover {
  background: rgba(255, 107, 107, 0.1);
}

.progress-bar-container {
  margin: 1rem 2rem;
}

.progress-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  opacity: 0.8;
}

.progress-bar-track {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--exp-arr), var(--exp-dt));
  border-radius: 99px;
  transition: width 0.4s ease;
}
</style>
