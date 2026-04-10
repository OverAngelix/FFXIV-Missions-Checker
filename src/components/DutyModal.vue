<template>
  <div class="modal-backdrop" @click="close">
    <div class="modal-content" @click.stop :style="{ '--expansion-color': duty.expansionId !== undefined ? getExpansionColor(duty.expansionId) : '#ccc' }">
      <div class="modal-header">
        <div class="modal-title-area">
          <h2>{{ duty.name }}</h2>
          <span v-if="duty.level && duty.level > 0" class="modal-level">Niv. {{ duty.level }}</span>
        </div>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">

        <div v-if="duty.description" class="section description">
          <p>{{ duty.description }}</p>
        </div>

        <div v-if="duty.prerequis && duty.prerequis.length > 0" class="section prerequis">
          <h3>Prérequis</h3>
          <ul class="prerequis-list">
            <li v-for="(req, idx) in duty.prerequis" :key="idx" class="prerequis-item">
              <div class="prerequis-name">
                <img :src="getQuestIcon(req.type)" alt="Type de Quête" class="quest-icon" />
                {{ req.name }}
              </div>
              <div class="prerequis-details">
                <span v-if="req.PNJ" class="prerequis-npc">👤 {{ req.PNJ }}</span>
                <span v-if="req.location" class="prerequis-loc">📍 {{ req.location }}</span>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="duty.bosses && duty.bosses.length > 0" class="section bosses">
          <h3>Boss</h3>
          <ul class="boss-list">
            <li v-for="(boss, idx) in duty.bosses" :key="idx" class="boss-item">
              <span class="boss-name">
                <img :src="iconMonster" alt="Boss" class="monster-icon" />
                {{ boss.name }}
              </span>
              <ul v-if="boss.recompenses && boss.recompenses.length > 0" class="reward-list">
                <li v-for="(reward, ridx) in boss.recompenses" :key="ridx" class="reward-item">
                  <span class="reward-icon">🎁</span> {{ reward.name }}
                </li>
              </ul>
            </li>
          </ul>
        </div>
        
        <div v-if="duty.guide" class="section guide-section text-center">
          <a :href="duty.guide" target="_blank" rel="noopener noreferrer" class="guide-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Lire le guide
          </a>
        </div>
        
        <div v-if="!duty.description && (!duty.bosses || duty.bosses.length === 0) && !duty.guide && (!duty.prerequis || duty.prerequis.length === 0)" class="empty-state">
          Aucune information supplémentaire disponible pour cette instance.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import iconMainScenario from '../assets/icons/FFXIV_Main_Scenario_Quest_Icon.webp';
import iconBlueQuest from '../assets/icons/FFXIV_Blue_Quest_Icon.webp';
import iconQuest from '../assets/icons/FFXIV_Quest_Icon.webp';
import iconMonster from '../assets/icons/monster.png';

const props = defineProps({
  duty: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const onKeydown = (e) => {
  if (e.key === 'Escape') close();
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKeydown);
});

const getExpansionColor = (id) => {
  const colors = {
    0: 'var(--exp-arr)',
    1: 'var(--exp-hw)',
    2: 'var(--exp-sb)',
    3: 'var(--exp-shb)',
    4: 'var(--exp-ew)',
    5: 'var(--exp-dt)',
  };
  return colors[id] || 'var(--text-primary)';
};

const getQuestIcon = (type) => {
  if (!type) return iconQuest;
  const t = type.toLowerCase();
  if (t === 'main_scenario' || t === 'main scenario') {
    return iconMainScenario;
  } else if (t === 'blue_quest' || t === 'blue quest') {
    return iconBlueQuest;
  }
  return iconQuest;
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(30, 30, 34, 0.85);
  border: 1px solid color-mix(in srgb, var(--expansion-color) 40%, transparent);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px color-mix(in srgb, var(--expansion-color) 20%, transparent);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(40, 40, 46, 0.9), transparent);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-area h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #fff;
}

.modal-level {
  background-color: color-mix(in srgb, var(--expansion-color) 15%, transparent);
  color: var(--expansion-color);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  color: #ddd;
}

.section {
  margin-bottom: 24px;
}

.text-center {
  text-align: center;
  margin-top: 30px;
  margin-bottom: 0;
}

.guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: color-mix(in srgb, var(--expansion-color) 20%, transparent);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--expansion-color) 40%, transparent);
  transition: all 0.2s ease;
}

.guide-btn:hover {
  background-color: var(--expansion-color);
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--expansion-color) 40%, transparent);
}

.section h3 {
  color: var(--expansion-color);
  margin-bottom: 12px;
  font-size: 1.1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--expansion-color) 20%, transparent);
  padding-bottom: 6px;
}

.description p {
  line-height: 1.6;
  font-size: 0.95rem;
  background: rgba(20, 20, 24, 0.4);
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid var(--expansion-color);
  margin: 0;
}

.prerequis-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.prerequis-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 2px solid color-mix(in srgb, var(--expansion-color) 40%, transparent);
}

.prerequis-name {
  font-weight: bold;
  color: #fff;
  font-size: 1.05rem;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quest-icon {
  width: 24px;
  height: 24px;
}

.prerequis-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
  color: #bbb;
  padding-left: 24px;
}

.boss-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.boss-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.boss-name {
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  margin-bottom: 6px;
}

.monster-icon {
  width: 20px;
  height: 20px;
}

.reward-list {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 20px;
}

.reward-item {
  font-size: 0.9rem;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  color: #777;
  font-style: italic;
  padding: 30px 0;
}
</style>
