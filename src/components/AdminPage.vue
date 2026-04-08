<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import dutiesData from '../assets/duties.json';

const router = useRouter();

const password = ref('');
const isAuthenticated = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const isLoading = ref(false);

const duties = ref(JSON.parse(JSON.stringify(dutiesData))); // deep copy

const searchQuery = ref('');

const filteredDuties = computed(() => {
  if (!searchQuery.value) return duties.value;
  return duties.value.filter(d => 
    d.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

const authenticate = () => {
  if (password.value === '123') {
    isAuthenticated.value = true;
    errorMsg.value = '';
  } else {
    errorMsg.value = 'Mot de passe incorrect.';
  }
};

const saveDuties = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  
  try {
    const response = await fetch('/api/save-duties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: password.value,
        duties: duties.value
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      successMsg.value = 'Modifications enregistrées avec succès !';
      setTimeout(() => successMsg.value = '', 5000);
    } else {
      errorMsg.value = result.error || 'Erreur lors de l\'enregistrement.';
    }
  } catch (err) {
    errorMsg.value = 'Erreur réseau.';
  } finally {
    isLoading.value = false;
  }
};

const editingDuty = ref(null);
const editingJsonStr = ref('');
const jsonError = ref('');

const activeEditorTab = ref('form'); // 'form' or 'json'

const editDuty = (duty) => {
  editingDuty.value = duty;
  editingJsonStr.value = JSON.stringify(duty, null, 2);
  jsonError.value = '';
};

const applyJson = () => {
  try {
    const parsed = JSON.parse(editingJsonStr.value);
    
    // Find the duty in the original array and update it
    const index = duties.value.findIndex(d => d.id === editingDuty.value.id);
    if (index !== -1) {
      duties.value[index] = parsed;
      editingDuty.value = parsed; // update current context
      jsonError.value = '';
      successMsg.value = 'JSON appliqué localement. N\'oubliez pas de Sauvegarder !';
      setTimeout(() => successMsg.value = '', 3000);
    }
  } catch (e) {
    jsonError.value = 'Erreur de syntaxe JSON : ' + e.message;
  }
};

const applyForm = () => {
    const index = duties.value.findIndex(d => d.id === editingDuty.value.id);
    if (index !== -1) {
      duties.value[index] = editingDuty.value;
      editingJsonStr.value = JSON.stringify(editingDuty.value, null, 2);
      successMsg.value = 'Formulaire appliqué. N\'oubliez pas de Sauvegarder !';
      setTimeout(() => successMsg.value = '', 3000);
    }
};

const closeEdit = () => {
  editingDuty.value = null;
};

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <h2>Administration de duties.json</h2>
      <button class="close-admin-btn" @click="goHome">Retour au site</button>
    </div>

    <!-- Login screen -->
    <div v-if="!isAuthenticated" class="login-container">
      <h3>Accès restreint</h3>
      <div class="input-group">
        <input 
          type="password" 
          v-model="password" 
          placeholder="Mot de passe" 
          @keyup.enter="authenticate"
        />
        <button @click="authenticate" class="primary-btn">Se connecter</button>
      </div>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>

    <!-- Admin Panel -->
    <div v-else class="admin-panel">
      <div class="admin-controls">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Rechercher une mission (nom, description)..." 
          />
        </div>
        <div class="actions">
          <button @click="saveDuties" class="save-btn" :disabled="isLoading">
            {{ isLoading ? 'Enregistrement...' : 'Sauvegarder duties.json' }}
          </button>
        </div>
      </div>
      
      <p v-if="successMsg" class="success-msg">{{ successMsg }}</p>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <div class="admin-content">
        <!-- List of duties -->
        <div class="duties-list">
          <div 
            v-for="duty in filteredDuties" 
            :key="duty.id" 
            class="list-item"
            :class="{ active: editingDuty && editingDuty.id === duty.id }"
            @click="editDuty(duty)"
          >
            <span class="duty-id">#{{ duty.id }}</span>
            <span class="duty-name">{{ duty.name }}</span>
            <span class="duty-exp">{{ duty.expansionName }}</span>
          </div>
        </div>

        <!-- Editor area -->
        <div class="duty-editor" v-if="editingDuty">
          <div class="editor-header">
            <h3>Édition : {{ editingDuty.name }}</h3>
            <button class="close-edit-btn" @click="closeEdit">Fermer</button>
          </div>
          
          <div class="editor-tabs">
            <button 
              :class="['tab-btn', { active: activeEditorTab === 'form' }]"
              @click="activeEditorTab = 'form'"
            >Vue Formulaire</button>
            <button 
              :class="['tab-btn', { active: activeEditorTab === 'json' }]"
              @click="activeEditorTab = 'json'"
            >Vue JSON (Brut)</button>
          </div>

          <div class="editor-body">
            <!-- Form View -->
            <div v-if="activeEditorTab === 'form'" class="form-view">
              <div class="form-group">
                <label>ID</label>
                <input type="number" v-model="editingDuty.id" disabled class="disabled-input" />
              </div>
              
              <div class="form-group">
                <label>Nom <span class="required">*</span></label>
                <input type="text" v-model="editingDuty.name" />
              </div>

              <div class="form-group-row">
                <div class="form-group flex-1">
                  <label>Niveau</label>
                  <input type="number" v-model="editingDuty.level" />
                </div>
                <div class="form-group flex-1">
                  <label>Type</label>
                  <input type="text" v-model="editingDuty.type" />
                </div>
                <div class="form-group flex-1">
                  <label>Difficulté</label>
                  <input type="text" v-model="editingDuty.difficulty" />
                </div>
              </div>

              <div class="form-group">
                <label>URL d'information Lodestone</label>
                <input type="text" v-model="editingDuty.lodestone_info" />
              </div>

              <div class="form-group">
                <label>URL de l'image Lodestone</label>
                <input type="text" v-model="editingDuty.lodestone_image" />
              </div>
              
              <div class="form-group">
                <label>URL du Guide (Ex: ffxiv-eorzea)</label>
                <input type="text" v-model="editingDuty.guide" />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea v-model="editingDuty.description" class="form-textarea" rows="5"></textarea>
              </div>

              <div class="form-notice">
                <p>Note : Pour éditer les tableaux complexes (bosses, prerequis), veuillez utiliser l'onglet "Vue JSON".</p>
              </div>

              <button @click="applyForm" class="apply-btn">Appliquer les modifications (Formulaire)</button>
            </div>

            <!-- JSON View -->
            <div v-if="activeEditorTab === 'json'" class="json-view">
              <p class="helper-text">Modifiez directement l'objet JSON complet ci-dessous :</p>
              <textarea 
                v-model="editingJsonStr" 
                class="json-textarea"
                spellcheck="false"
              ></textarea>
              
              <p v-if="jsonError" class="error-msg json-error">{{ jsonError }}</p>
              
              <button @click="applyJson" class="apply-btn">Appliquer les modifications (JSON)</button>
            </div>
          </div>
        </div>
        <div class="duty-editor empty" v-else>
          <p>Sélectionnez une mission à gauche pour l'éditer.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  background-color: var(--bg-tertiary, #1f2b3e);
  min-height: 100vh;
  padding: 2rem;
  color: white;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-sizing: border-box;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-header h2 {
  margin: 0;
  font-size: 2rem;
  color: var(--accent-light, #a6d4fa);
}

.close-admin-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-admin-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.login-container {
  max-width: 400px;
  margin: 5rem auto;
  background: var(--bg-secondary, #121926);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  text-align: center;
}

.login-container h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  gap: 1rem;
}

.input-group input {
  flex: 1;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1rem;
}

.primary-btn, .save-btn, .apply-btn {
  background: var(--accent-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.primary-btn:hover, .save-btn:hover, .apply-btn:hover {
  background: var(--accent-light, #72abeb);
}

.save-btn {
  background: #28a745;
}
.save-btn:hover {
  background: #34ce57;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.search-box input {
  width: 100%;
  min-width: 300px;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 1rem;
}

.admin-content {
  display: flex;
  gap: 2rem;
  height: calc(100vh - 200px);
}

.duties-list {
  flex: 1;
  background: var(--bg-secondary, #121926);
  border-radius: 12px;
  overflow-y: auto;
  padding: 1rem;
}

.list-item {
  display: grid;
  grid-template-columns: 50px 1fr auto;
  padding: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  align-items: center;
  transition: background 0.2s;
}

.list-item:hover, .list-item.active {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.duty-id {
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

.duty-name {
  font-weight: 500;
}

.duty-exp {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 1rem;
}

.duty-editor {
  flex: 2;
  background: var(--bg-secondary, #121926);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.duty-editor.empty {
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.editor-header h3 {
  margin: 0;
  color: var(--accent-color, #4a90e2);
}

.editor-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.tab-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: var(--accent-light, #a6d4fa);
  background: rgba(74, 144, 226, 0.2);
}

.close-edit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.json-view, .form-view {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.helper-text {
  margin-top: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.flex-1 {
  flex: 1;
}

.form-group label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.3rem;
}

.required {
  color: #ff6b6b;
}

.form-group input, .form-textarea {
  padding: 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.25);
  color: white;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent-light, #72abeb);
}

.disabled-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
}

.form-notice {
  background: rgba(255, 204, 0, 0.1);
  border-left: 4px solid #ffcc00;
  padding: 0.8rem 1rem;
  border-radius: 0 4px 4px 0;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.json-textarea {
  flex: 1;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #a6d4fa;
  font-family: monospace;
  font-size: 14px;
  padding: 1rem;
  resize: vertical;
  margin-bottom: 1rem;
  min-height: 400px;
}

.json-textarea:focus {
  outline: none;
  border-color: var(--accent-light, #72abeb);
}

.apply-btn {
  width: 100%;
  margin-top: auto;
}

.error-msg {
  color: #ff6b6b;
  margin-top: 0.5rem;
}

.json-error {
  background: rgba(255, 107, 107, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  font-family: monospace;
}

.success-msg {
  color: #51cf66;
  background: rgba(81, 207, 102, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}
</style>
