<template>
  <q-page class="bg-black text-white q-pa-md">
    <div class="text-h5 text-amber q-mb-lg text-center">Profil Saya</div>

    <div class="q-gutter-y-md">
      <q-input dark filled v-model="form.nama_lengkap" label="Nama Lengkap" color="amber" />
      <q-input dark filled v-model="form.kelas" label="Kelas" color="amber" />
      
      <q-btn 
        label="Simpan Data" 
        color="amber" 
        text-color="black" 
        class="full-width" 
        @click="updateProfile" 
        :loading="loading"
      />

      <q-separator color="grey-8" class="q-my-lg" />

      <q-btn 
        label="Keluar (Logout)" 
        color="red-9" 
        flat 
        class="full-width bg-grey-9" 
        @click="logout"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const loading = ref(false)
const form = ref({ nama_lengkap: '', kelas: '' })

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Kita ambil data, tanpa ambil variabel 'error' agar tidak warning
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) form.value = data
  }
})

const updateProfile = async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('profiles')
    .update(form.value)
    .eq('id', user.id)

  loading.value = false
  if (!error) $q.notify({ type: 'positive', message: 'Tersimpan!' })
}

const logout = async () => {
  await supabase.auth.signOut()
  router.replace('/login')
}
</script>