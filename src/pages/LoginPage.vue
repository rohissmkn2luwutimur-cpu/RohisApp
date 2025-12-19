<template>
  <q-page class="flex flex-center bg-black">
    <q-card class="q-pa-lg shadow-24 login-card relative-position">
      
      <div class="glow-effect"></div>

      <div class="text-center q-mb-lg relative-position">
        
        <div class="q-mb-md">
          <q-icon name="mosque" size="80px" color="amber" class="icon-shadow" />
        </div>

        <div class="text-h4 text-weight-bold text-amber">ROHIS APP</div>
        <div class="text-caption text-grey-4">Masuk untuk melanjutkan aktivitas</div>
      </div>

      <q-form @submit.prevent="handleLogin" class="q-gutter-y-md relative-position">
        
        <q-input 
          dark filled 
          v-model="email" 
          label="Email" 
          type="email" 
          color="amber" 
          bg-color="grey-9" 
          class="input-rounded"
          :rules="[val => !!val || 'Email harus diisi']"
        >
          <template v-slot:prepend><q-icon name="email" color="amber" /></template>
        </q-input>

        <q-input 
          dark filled 
          v-model="password" 
          :type="showPassword ? 'text' : 'password'" 
          label="Password" 
          color="amber" 
          bg-color="grey-9" 
          class="input-rounded"
          :rules="[val => !!val || 'Password harus diisi']"
        >
          <template v-slot:prepend><q-icon name="lock" color="amber" /></template>
          <template v-slot:append>
            <q-icon 
              :name="showPassword ? 'visibility' : 'visibility_off'" 
              class="cursor-pointer text-amber" 
              @click="showPassword = !showPassword" 
            />
          </template>
        </q-input>

        <div class="q-pt-sm">
          <q-btn 
            :loading="loading" 
            type="submit" 
            label="MASUK" 
            color="amber" 
            text-color="black" 
            class="full-width text-weight-bold shadow-10 btn-glow" 
            rounded 
          />
        </div>
        
        <div class="text-center q-mt-md text-caption text-grey-5">
          Belum punya akun? <span class="text-amber cursor-pointer hover-underline text-weight-bold" @click="$router.push('/register')">Daftar disini</span>
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true

  try {
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (authError) throw authError

    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profileError) {
      console.warn("Profil tidak ditemukan, membuat profil baru...")
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          nama_lengkap: user.user_metadata?.full_name || 'Tanpa Nama',
          role: 'member'
        })
        .select()
        .single()
      
      if (!createError) profile = newProfile
    }

    $q.notify({ type: 'positive', message: `Selamat Datang, ${profile?.nama_lengkap || 'User'}!` })
    
    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/home')
    }

  } catch (err) {
    let msg = err.message
    if (msg.includes('Invalid login')) msg = 'Email atau Password salah!'
    if (msg.includes('Email not confirmed')) msg = 'Email belum diverifikasi.'
    
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 380px;
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.glow-effect {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 193, 7, 0.15) 0%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.icon-shadow {
  text-shadow: 0 0 20px rgba(255, 193, 7, 0.6); /* Efek cahaya pada icon */
}

.input-rounded :deep(.q-field__control) {
  border-radius: 12px;
}

.btn-glow {
  transition: all 0.3s;
  letter-spacing: 1px;
}

.btn-glow:hover {
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.4);
  transform: translateY(-1px);
}

.hover-underline:hover {
  text-decoration: underline;
}
</style>