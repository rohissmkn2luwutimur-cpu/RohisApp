<template>
  <q-page class="q-pa-md bg-black text-white q-pb-xl">
    <div class="text-h5 text-weight-bold text-amber q-mb-md">📅 Kalender Kegiatan</div>

    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="40px" color="amber" />
    </div>

    <div v-else-if="jadwal.length === 0" class="text-center text-grey q-mt-xl">
      <q-icon name="event_busy" size="50px" />
      <div>Belum ada jadwal kegiatan.</div>
    </div>

    <div v-else class="q-gutter-y-md">
      <q-card v-for="item in jadwal" :key="item.id" class="bg-grey-9 shadow-2 border-left-amber">
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="col-auto bg-amber text-black q-pa-sm rounded-borders text-center q-mr-md" style="min-width: 60px">
              <div class="text-h6 text-weight-bold">{{ new Date(item.tanggal).getDate() }}</div>
              <div class="text-caption text-uppercase text-weight-bold">{{ new Date(item.tanggal).toLocaleString('default', { month: 'short' }) }}</div>
            </div>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{ item.nama_kegiatan }}</div>
              <div class="text-caption text-grey-4">
                <q-icon name="schedule" size="xs" /> {{ item.jam }} WITA
              </div>
              <div class="text-caption text-grey-4">
                 <q-icon name="place" size="xs" /> {{ item.lokasi || 'Masjid Sekolah' }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'

const jadwal = ref([])
const loading = ref(true)

const loadJadwal = async () => {
  loading.value = true
  // Ambil kegiatan yang belum lewat (tanggal >= hari ini)
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('kegiatan')
    .select('*')
    .gte('tanggal', today) 
    .order('tanggal', { ascending: true })

  if (!error) jadwal.value = data
  loading.value = false
}

onMounted(loadJadwal)
</script>

<style scoped>
.border-left-amber { border-left: 5px solid #ffc107; }
</style>