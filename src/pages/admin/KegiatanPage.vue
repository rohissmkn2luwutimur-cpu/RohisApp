<template>
  <q-page class="q-pa-md bg-black text-white">
    
    <div class="row justify-between items-center q-mb-md">
      <div>
        <div class="text-h5 text-amber text-weight-bold">Manajemen Kegiatan</div>
        <div class="text-caption text-grey">Atur Jadwal, Jam & Lokasi Absensi</div>
      </div>
      <q-btn 
        color="amber" 
        text-color="black" 
        icon="add" 
        label="Buat Baru" 
        @click="openDialog()" 
      />
    </div>

    <q-tabs
      v-model="tab" 
      dense 
      class="text-grey q-mb-lg" 
      active-color="amber" 
      indicator-color="amber" 
      align="left" 
      narrow-indicator
    >
      <q-tab name="all" label="Semua" />
      <q-tab name="Harian" label="Harian" />
      <q-tab name="Mingguan" label="Mingguan" />
      <q-tab name="Bulanan" label="Bulanan" />
      <q-tab name="Tahunan" label="Tahunan" />
    </q-tabs>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-dots color="amber" size="40px" />
    </div>

    <div v-else-if="filteredList.length === 0" class="text-center text-grey q-pa-lg">
      <q-icon name="event_busy" size="50px" />
      <div class="q-mt-sm">Belum ada kegiatan</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="k in filteredList" :key="k.id" class="col-12 col-md-6">
        <q-card class="bg-grey-9 text-white shadow-2 overflow-hidden relative-position">
          <div class="absolute-left full-height bg-amber" style="width: 4px;"></div>
          
          <div class="q-pa-md row no-wrap items-center">
            <div class="column flex-center q-mr-md text-center" style="min-width: 60px">
               <div class="text-h4 text-weight-bold lh-1">{{ extractDate(k.tanggal, 'DOM') }}</div>
               <div class="text-caption text-uppercase text-grey-5">{{ extractDate(k.tanggal, 'MMM') }}</div>
            </div>
            
            <div class="col">
              <div class="row items-center q-gutter-x-sm q-mb-xs">
                <q-badge outline color="amber">{{ k.kategori }}</q-badge>
                <q-badge color="blue-grey-8" text-color="white">
                  <q-icon name="schedule" size="xs" class="q-mr-xs"/> {{ formatTime(k.jam) }}
                </q-badge>
              </div>
              
              <div class="text-h6 leading-tight ellipsis-2-lines">{{ k.nama_kegiatan }}</div>
              
              <div class="row q-gutter-x-sm q-mt-sm">
                <q-chip v-if="k.lat && k.long" dense size="sm" icon="place" color="green-9" text-color="white">
                  GPS Aktif
                </q-chip>
                <q-chip v-else dense size="sm" icon="place" color="grey-8" text-color="grey-5">
                  Tanpa GPS
                </q-chip>
                <q-chip v-if="k.kode_absen && k.kode_absen !== '-'" dense size="sm" icon="key" color="blue-9" text-color="white">
                  Kode: {{ k.kode_absen }}
                </q-chip>
              </div>
            </div>

            <div class="column q-gutter-y-sm">
              <q-btn flat round color="blue" icon="edit" size="sm" @click="openDialog(k)" />
              <q-btn flat round color="red" icon="delete" size="sm" @click="hapus(k.id)" />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="bg-grey-9 text-white" style="min-width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-amber">{{ isEdit ? 'Edit Kegiatan' : 'Kegiatan Baru' }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md scroll" style="max-height: 70vh;">
          <q-input dark filled v-model="form.nama_kegiatan" label="Nama Kegiatan" color="amber" :rules="[val => !!val || 'Wajib diisi']" />
          
          <div class="row q-col-gutter-md">
            <div class="col-7">
              <q-input dark filled v-model="form.tanggal" type="date" label="Tanggal" stack-label color="amber" />
            </div>
            <div class="col-5">
              <q-input dark filled v-model="form.jam" type="time" label="Jam Mulai" stack-label color="amber" />
            </div>
          </div>

          <q-select dark filled v-model="form.kategori" :options="['Harian', 'Mingguan', 'Bulanan', 'Tahunan']" label="Jenis Kegiatan" color="amber" />

          <q-separator color="grey-8" />

          <div>
            <div class="text-subtitle2 text-amber q-mb-xs">
              <q-icon name="my_location" /> Titik Lokasi Absen (GPS)
            </div>
            <div class="text-caption text-grey q-mb-sm">Klik tombol di bawah saat kamu berada di lokasi.</div>
            
            <q-btn 
              :loading="gpsLoading"
              color="green-6" 
              class="full-width q-mb-sm" 
              icon="add_location_alt" 
              label="Ambil Lokasi Saya" 
              @click="getCurrentLocation" 
            />

            <div class="row q-col-gutter-sm" v-if="form.lat">
              <div class="col-6"><q-input readonly dense dark filled v-model="form.lat" label="Latitude" /></div>
              <div class="col-6"><q-input readonly dense dark filled v-model="form.long" label="Longitude" /></div>
            </div>
          </div>

          <div>
            <div class="row justify-between items-center q-mb-sm">
              <div class="text-subtitle2 text-grey-4">Pakai Kode Unik?</div>
              <q-toggle v-model="useKode" color="blue" label="Ya" left-label />
            </div>
            
            <q-slide-transition>
              <div v-if="useKode">
                <q-input dark filled v-model="form.kode_absen" label="Kode Absen" hint="Klik refresh untuk auto-generate">
                  <template v-slot:append>
                    <q-btn round dense flat icon="autorenew" color="blue" @click="generateCode" />
                  </template>
                </q-input>
              </div>
            </q-slide-transition>
          </div>

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
import { useQuasar, date } from 'quasar'

const $q = useQuasar()

// State
const kegiatanList = ref([])
const loading = ref(true)
const saving = ref(false)
const gpsLoading = ref(false)
const dialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const tab = ref('all')
const useKode = ref(false)

const form = ref({ 
  nama_kegiatan: '', 
  tanggal: '', 
  jam: '16:00', 
  kategori: 'Mingguan',
  kode_absen: '', 
  lat: null,
  long: null,
  radius: 50 
})

// Helpers untuk Formatting (Lebih ringan daripada new Date() di template)
const extractDate = (val, format) => {
  if (!val) return '-'
  return date.formatDate(val, format)
}

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5)
}

const filteredList = computed(() => {
  if (tab.value === 'all') return kegiatanList.value
  return kegiatanList.value.filter(k => k.kategori === tab.value)
})

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    return $q.notify({ type: 'negative', message: 'Browser tidak support GPS' })
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.lat = position.coords.latitude
      form.value.long = position.coords.longitude
      gpsLoading.value = false
      $q.notify({ type: 'positive', message: 'Lokasi berhasil dikunci!', icon: 'my_location' })
    },
    (err) => {
      gpsLoading.value = false
      $q.notify({ type: 'negative', message: 'Gagal ambil lokasi: ' + err.message })
    },
    { enableHighAccuracy: true, timeout: 5000 }
  )
}

const generateCode = () => {
  form.value.kode_absen = Math.random().toString(36).substring(2, 7).toUpperCase()
}

const openDialog = (data = null) => {
  if (data) {
    isEdit.value = true
    editId.value = data.id
    // Clone data agar tidak mengubah tampilan list secara reaktif sebelum disimpan
    form.value = { ...data } 
    
    // Logic toggle kode
    useKode.value = !!(data.kode_absen && data.kode_absen !== '-')
    
    if(!form.value.jam) form.value.jam = '16:00'
  } else {
    isEdit.value = false
    editId.value = null
    useKode.value = false
    
    // Reset Form
    form.value = { 
      nama_kegiatan: '', 
      tanggal: date.formatDate(new Date(), 'YYYY-MM-DD'), // Menggunakan tanggal hari ini
      jam: '16:00',
      kategori: 'Mingguan',
      kode_absen: '',
      lat: null, 
      long: null,
      radius: 50 
    }
  }
  dialog.value = true
}

const loadData = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .order('tanggal', { ascending: false })
      
    if (error) throw error
    kegiatanList.value = data || []
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal muat data: ' + err.message })
  } finally {
    loading.value = false
  }
}

const simpan = async () => {
  // Validasi
  if (!form.value.nama_kegiatan || !form.value.tanggal) {
    return $q.notify({ type: 'warning', message: 'Nama Kegiatan dan Tanggal wajib diisi!' })
  }

  saving.value = true

  // Persiapkan Payload (PENTING: Buang properti yang tidak perlu seperti 'id' atau 'created_at')
  const payload = {
    nama_kegiatan: form.value.nama_kegiatan,
    tanggal: form.value.tanggal,
    jam: form.value.jam,
    kategori: form.value.kategori,
    lat: form.value.lat,
    long: form.value.long,
    radius: form.value.radius,
    kode_absen: useKode.value ? form.value.kode_absen : '-' // Set strip jika toggle mati
  }

  let errorMsg = null

  try {
    if (isEdit.value) {
      const { error } = await supabase
        .from('kegiatan')
        .update(payload) // Kirim payload bersih, bukan form.value mentah
        .eq('id', editId.value)
      errorMsg = error
    } else {
      const { error } = await supabase
        .from('kegiatan')
        .insert(payload)
      errorMsg = error
    }

    if (errorMsg) throw errorMsg

    $q.notify({ type: 'positive', message: 'Data Berhasil Disimpan!' })
    dialog.value = false
    loadData()
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Gagal Simpan: ' + err.message })
  } finally {
    saving.value = false
  }
}

const hapus = async (id) => {
  $q.dialog({
    title: 'Konfirmasi',
    message: 'Yakin ingin menghapus kegiatan ini?',
    cancel: true,
    persistent: true,
    dark: true // Tema gelap untuk dialog confirm
  }).onOk(async () => {
    try {
      const { error } = await supabase.from('kegiatan').delete().eq('id', id)
      if (error) throw error
      
      $q.notify({ type: 'positive', message: 'Terhapus' })
      loadData()
    } catch (err) {
      $q.notify({ type: 'negative', message: 'Gagal hapus: ' + err.message })
    }
  })
}

onMounted(() => loadData())
</script>