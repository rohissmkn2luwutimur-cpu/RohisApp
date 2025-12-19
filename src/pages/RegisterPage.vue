<template>
  <q-page class="flex flex-center bg-black">
    
    <q-card class="register-card q-pa-lg shadow-24 relative-position">
      <div class="glow-effect"></div>

      <div class="text-center q-mb-md relative-position">
        <div class="text-h5 text-weight-bold text-white">DAFTAR ANGGOTA</div>
        <div class="text-caption text-grey-4">Bergabunglah bersama keluarga besar Rohis</div>
      </div>

      <q-form @submit.prevent="handleRegister" class="q-gutter-y-sm relative-position">
        
        <q-input dark filled dense v-model="form.nama" label="Nama Lengkap" color="amber" bg-color="grey-9" class="input-rounded" :rules="[val => !!val || 'Wajib diisi']">
          <template v-slot:prepend><q-icon name="person" color="amber" /></template>
        </q-input>

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input dark filled dense v-model="form.kelas" label="Kelas" placeholder="X RPL 1" color="amber" bg-color="grey-9" class="input-rounded" :rules="[val => !!val || 'Wajib diisi']" />
          </div>
          <div class="col-6">
            <q-input dark filled dense v-model="form.no_hp" label="No. WA" type="tel" mask="####-####-####" unmasked-value color="amber" bg-color="grey-9" class="input-rounded" :rules="[val => !!val || 'Wajib diisi']" />
          </div>
        </div>

        <q-input dark filled dense v-model="form.email" label="Email Sekolah" type="email" color="amber" bg-color="grey-9" class="input-rounded" :rules="[val => !!val || 'Wajib diisi']">
          <template v-slot:prepend><q-icon name="email" color="amber" /></template>
        </q-input>

        <q-input 
          dark filled dense
          v-model="form.password" 
          :type="showPassword ? 'text' : 'password'" 
          label="Buat Kata Sandi" 
          color="amber"
          bg-color="grey-9"
          class="input-rounded"
          :rules="[val => val.length >= 6 || 'Minimal 6 karakter']"
        >
          <template v-slot:prepend>
            <q-icon name="lock" color="amber" />
          </template>
          <template v-slot:append>
            <q-icon 
              :name="showPassword ? 'visibility' : 'visibility_off'" 
              class="cursor-pointer" 
              @click="showPassword = !showPassword" 
            />
          </template>
        </q-input>

        <div class="q-pt-sm">
          <q-btn label="DAFTAR SEKARANG" type="submit" color="amber" text-color="black" class="full-width text-weight-bold shadow-10 btn-glow" rounded :loading="loading" />
        </div>

      </q-form>

      <div class="text-center q-mt-md text-caption text-grey-5">
        Sudah punya akun? <span class="text-amber cursor-pointer hover-underline text-weight-bold" @click="$router.push('/login')">Login disini</span>
      </div>
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
const loading = ref(false)
const showPassword = ref(false) // Variabel untuk kontrol mata

const form = ref({
  nama: '',
  kelas: '',
  no_hp: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  if (!form.value.nama || !form.value.email || !form.value.password || !form.value.no_hp || !form.value.kelas) {
    return $q.notify({ type: 'negative', message: 'Semua data wajib diisi!' })
  }

  loading.value = true

  try {
    // 1. DAFTAR AUTH
    const { data, error } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: { data: { full_name: form.value.nama } }
    })

    if (error) throw error

    // 2. SIMPAN PROFIL
    if (data?.user) {
      const { error: errProfile } = await supabase
        .from('profiles')
        .upsert({ 
          id: data.user.id,
          nama_lengkap: form.value.nama,
          email: form.value.email,
          no_hp: form.value.no_hp,
          kelas: form.value.kelas 
        })
      
      if (errProfile) console.error('Gagal update detail:', errProfile)
    }

    $q.notify({ type: 'positive', message: 'Pendaftaran Berhasil! Silakan Login.' })
    router.push('/login')

  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-card { width: 100%; max-width: 400px; background: rgba(30, 30, 30, 0.95); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 20px; backdrop-filter: blur(10px); }
.glow-effect { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 180px; height: 180px; background: radial-gradient(circle, rgba(255, 193, 7, 0.25) 0%, transparent 70%); filter: blur(40px); pointer-events: none; z-index: 0; }
.input-rounded :deep(.q-field__control) { border-radius: 12px; }
.btn-glow { transition: all 0.3s ease; letter-spacing: 1px; }
.btn-glow:hover { box-shadow: 0 0 20px rgba(255, 193, 7, 0.5); transform: translateY(-2px); }
.hover-underline:hover { text-decoration: underline; }
</style>