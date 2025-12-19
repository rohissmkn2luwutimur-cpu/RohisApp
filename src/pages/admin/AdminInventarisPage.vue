<template>
  <q-page class="q-pa-md bg-black text-white">
    
    <div class="row justify-between items-center q-mb-md q-col-gutter-y-md">
      <div class="col-12 col-md-auto">
        <div class="text-h5 text-amber text-weight-bold">Inventaris & Aset</div>
        <div class="text-caption text-grey">Total Item: {{ items.length }} | Total Unit: {{ totalUnit }}</div>
      </div>
      
      <div class="col-12 col-md-auto row q-gutter-x-md">
        <q-input 
          dark dense filled rounded
          v-model="search" 
          placeholder="Cari nama barang..." 
          color="amber"
          debounce="300"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        
        <q-btn 
          icon="add" 
          label="Tambah" 
          color="amber" 
          text-color="black" 
          @click="openDialog()" 
        />
      </div>
    </div>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-cube color="amber" size="40px" />
    </div>

    <div v-else-if="filteredItems.length === 0" class="text-center text-grey q-pa-xl border-dashed">
      <q-icon name="inventory_2" size="60px" color="grey-8" />
      <div class="text-h6 q-mt-sm">Data tidak ditemukan</div>
      <div class="text-caption">Belum ada barang atau kata kunci salah.</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="item in filteredItems" :key="item.id">
        <q-card class="bg-grey-9 text-white shadow-3 hover-effect">
          <q-card-section>
            <div class="row justify-between items-start">
              <div class="col">
                <div class="text-h6 ellipsis">{{ item.nama_barang }}</div>
                <div class="text-caption text-grey-4 row items-center">
                  <q-icon name="place" size="xs" class="q-mr-xs text-amber" /> 
                  {{ item.lokasi || 'Belum diatur' }}
                </div>
              </div>
              <q-badge :color="getWarnaKondisi(item.kondisi)" class="q-py-xs">
                {{ item.kondisi }}
              </q-badge>
            </div>
            
            <q-separator class="q-my-md bg-grey-8" />
            
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-5">Jumlah</div>
                <div class="text-h4 text-weight-bold text-amber">{{ item.jumlah }}</div>
              </div>
              <q-icon name="inventory" size="md" color="grey-8" />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="bg-grey-10">
            <q-btn flat round color="blue" icon="edit" size="sm" @click="openDialog(item)">
              <q-tooltip>Edit Barang</q-tooltip>
            </q-btn>
            <q-btn flat round color="red" icon="delete" size="sm" @click="hapus(item.id)">
               <q-tooltip>Hapus Barang</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="bg-grey-9 text-white" style="min-width: 350px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-amber">{{ isEdit ? 'Edit Barang' : 'Barang Baru' }}</div>
        </q-card-section>
        
        <q-card-section class="q-gutter-y-md">
          <q-input dark filled v-model="form.nama_barang" label="Nama Barang" color="amber" :rules="[val => !!val || 'Wajib diisi']" />
          
          <div class="row q-col-gutter-sm">
            <div class="col-6">
               <q-input dark filled v-model.number="form.jumlah" type="number" label="Jumlah" color="amber" />
            </div>
            <div class="col-6">
               <q-select dark filled v-model="form.kondisi" :options="['Baik', 'Rusak Ringan', 'Rusak Berat', 'Perbaikan']" label="Kondisi" color="amber" />
            </div>
          </div>
          
          <q-input dark filled v-model="form.lokasi" label="Lokasi Penyimpanan" hint="Contoh: Gudang A, Rak 2" color="amber">
            <template v-slot:prepend><q-icon name="place" /></template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="bg-black">
          <q-btn flat label="Batal" color="grey" v-close-popup />
          <q-btn :loading="saving" label="Simpan" color="amber" text-color="black" @click="simpan" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// State
const items = ref([])
const search = ref('')
const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({ 
  nama_barang: '', 
  jumlah: 0, 
  kondisi: 'Baik', 
  lokasi: '' 
})

// Computed
const filteredItems = computed(() => {
  if (!search.value) return items.value
  const keyword = search.value.toLowerCase()
  return items.value.filter(item => 
    item.nama_barang.toLowerCase().includes(keyword) || 
    (item.lokasi && item.lokasi.toLowerCase().includes(keyword))
  )
})

const totalUnit = computed(() => {
  return items.value.reduce((acc, curr) => acc + (parseInt(curr.jumlah) || 0), 0)
})

// Helper Warna Badge
const getWarnaKondisi = (kondisi) => {
  switch(kondisi) {
    case 'Baik': return 'green'
    case 'Rusak Ringan': return 'orange'
    case 'Rusak Berat': return 'red'
    case 'Perbaikan': return 'blue'
    default: return 'grey'
  }
}

// Logic Dialog
const openDialog = (data = null) => {
  if (data) {
    isEdit.value = true
    editId.value = data.id
    // Clone data agar reaktifitas tidak langsung mengubah UI sebelum save
    form.value = { ...data } 
  } else {
    isEdit.value = false
    editId.value = null
    form.value = { nama_barang: '', jumlah: 1, kondisi: 'Baik', lokasi: '' }
  }
  dialog.value = true
}

// CRUD Operations
const loadData = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase.from('inventaris').select('*').order('created_at', { ascending: false })
    if (error) throw error
    items.value = data
  } catch (err) {
    // FIX: Menggunakan variable err untuk menampilkan pesan
    console.error(err)
    $q.notify({ type: 'negative', message: 'Gagal muat data: ' + err.message })
  } finally {
    loading.value = false
  }
}

const simpan = async () => {
  if(!form.value.nama_barang) return $q.notify({type: 'warning', message: 'Nama barang wajib diisi'})
  
  saving.value = true
  
  // Sanitasi Payload: Hanya kirim data yang diperlukan
  const payload = {
    nama_barang: form.value.nama_barang,
    jumlah: form.value.jumlah,
    kondisi: form.value.kondisi,
    lokasi: form.value.lokasi
  }

  let errorMsg = null

  try {
    if (isEdit.value) {
      const { error } = await supabase.from('inventaris').update(payload).eq('id', editId.value)
      errorMsg = error
    } else {
      const { error } = await supabase.from('inventaris').insert(payload)
      errorMsg = error
    }

    if (errorMsg) throw errorMsg

    $q.notify({ type: 'positive', message: 'Data Tersimpan!' })
    dialog.value = false
    loadData()
  } catch (err) {
    // FIX: Menggunakan variable err untuk menampilkan pesan
    $q.notify({ type: 'negative', message: 'Gagal: ' + err.message })
  } finally {
    saving.value = false
  }
}

const hapus = async (id) => {
  $q.dialog({
    title: 'Hapus Barang?',
    message: 'Data yang dihapus tidak bisa dikembalikan.',
    cancel: true,
    persistent: true,
    dark: true
  }).onOk(async () => {
    try {
      const { error } = await supabase.from('inventaris').delete().eq('id', id)
      if (error) throw error
      $q.notify({ type: 'positive', message: 'Barang dihapus' })
      loadData()
    } catch (err) {
      // FIX: Menggunakan variable err untuk menampilkan pesan
      $q.notify({ type: 'negative', message: 'Gagal hapus: ' + err.message })
    }
  })
}

onMounted(() => loadData())
</script>

<style scoped>
/* Sedikit efek hover agar kartu terasa interaktif */
.hover-effect {
  transition: transform 0.2s;
}
.hover-effect:hover {
  transform: translateY(-3px);
  border: 1px solid #ffc107; /* Warna Amber */
}
.border-dashed {
  border: 2px dashed #424242;
  border-radius: 8px;
}
</style>