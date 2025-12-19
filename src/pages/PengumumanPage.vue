<template>
  <q-page class="q-pa-md bg-black text-white q-pb-xl">
    <div class="text-h5 text-weight-bold text-amber q-mb-md">📢 Papan Pengumuman</div>

    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="40px" color="amber" />
    </div>

    <div v-else-if="listPengumuman.length === 0" class="text-center text-grey q-mt-xl">
      <q-icon name="notifications_off" size="50px" />
      <div>Tidak ada pengumuman baru.</div>
    </div>

    <div v-else class="column q-gutter-y-md">
      <q-card v-for="item in listPengumuman" :key="item.id" class="bg-grey-9 relative-position">
        <q-item>
          <q-item-section avatar>
            <q-avatar color="amber" text-color="black" icon="campaign" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-bold">{{ item.judul }}</q-item-label>
            <q-item-label caption class="text-grey-5">{{ new Date(item.created_at).toLocaleDateString() }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator color="grey-8" inset />

        <q-card-section class="text-grey-3" style="white-space: pre-line;">
          {{ item.isi }}
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'

const listPengumuman = ref([])
const loading = ref(true)

const loadPengumuman = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('pengumuman')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) listPengumuman.value = data
  loading.value = false
}

onMounted(loadPengumuman)
</script>