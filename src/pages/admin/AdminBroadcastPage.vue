<template>
  <q-page class="q-pa-md bg-black text-white">
    <div class="text-h5 text-amber q-mb-lg">Broadcast Informasi</div>

    <q-card class="bg-grey-9 q-mb-lg">
      <q-card-section>
        <div class="q-gutter-y-md">
          <q-input dark filled v-model="judul" label="Judul Pengumuman" color="amber" />
          <q-input dark filled v-model="isi" type="textarea" label="Isi Pesan" color="amber" />
          <q-btn label="Kirim Pengumuman" color="amber" text-color="black" class="full-width" @click="kirim" :loading="loading" />
        </div>
      </q-card-section>
    </q-card>

    <div class="text-h6 q-mb-sm">Riwayat Pengumuman</div>
    <q-list separator class="bg-grey-9 rounded-borders">
      <q-item v-for="p in list" :key="p.id">
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ p.judul }}</q-item-label>
          <q-item-label caption class="text-grey-4">{{ p.isi }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round icon="delete" color="red" size="sm" @click="hapus(p.id)" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const judul = ref('')
const isi = ref('')
const loading = ref(false)
const list = ref([])

const loadData = async () => {
  const { data } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false })
  if (data) list.value = data
}

const kirim = async () => {
  if (!judul.value || !isi.value) return
  loading.value = true
  
  const { error } = await supabase.from('pengumuman').insert({
    judul: judul.value,
    isi: isi.value
  })

  loading.value = false
  if (!error) {
    $q.notify({ type: 'positive', message: 'Terikirim!' })
    judul.value = ''
    isi.value = ''
    loadData()
  }
}

const hapus = async (id) => {
  if (confirm('Hapus info ini?')) {
    await supabase.from('pengumuman').delete().eq('id', id)
    loadData()
  }
}

onMounted(() => loadData())
</script>