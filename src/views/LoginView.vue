<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">Q</div>
      <h2 class="login-title">Quant Dashboard</h2>
      <p class="login-subtitle">Sign in to continue</p>

      <a-form layout="vertical" @finish="onLogin">
        <a-form-item label="Username" name="username" :rules="[{ required: true, message: 'Required' }]">
          <a-input v-model:value="form.username" size="large" placeholder="Enter username" />
        </a-form-item>
        <a-form-item label="Password" name="password" :rules="[{ required: true, message: 'Required' }]">
          <a-input-password v-model:value="form.password" size="large" placeholder="Enter password" @pressEnter="onLogin" />
        </a-form-item>
        <a-alert v-if="authStore.error" :message="authStore.error" type="error" show-icon style="margin-bottom: 16px" />
        <a-button type="primary" html-type="submit" block size="large" :loading="authStore.loading">
          Sign In
        </a-button>
      </a-form>

      <div class="login-footer">
        <span class="login-hint">Or use API key authentication via .env</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({ username: '', password: '' });

async function onLogin() {
  try {
    await authStore.login(form.username, form.password);
    router.push('/');
  } catch {
    // error displayed via authStore.error
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--q-bg);
}

.login-card {
  width: 380px;
  background: var(--q-card);
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.login-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--q-primary), #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  margin: 0 auto 16px;
}

.login-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-text);
  margin: 0 0 4px;
}

.login-subtitle {
  text-align: center;
  font-size: 13px;
  color: var(--q-text-muted);
  margin: 0 0 24px;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.login-hint {
  font-size: 11px;
  color: var(--q-text-muted);
}
</style>
