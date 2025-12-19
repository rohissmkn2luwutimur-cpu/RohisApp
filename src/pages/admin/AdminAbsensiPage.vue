<template>
  <q-page class="q-pa-md bg-black text-white q-pb-xl">
    
    <div class="row items-center justify-between q-mb-lg animate-fade">
      <div>
        <div class="row items-center">
          <q-icon name="fact_check" color="amber" size="md" class="q-mr-sm" />
          <div class="text-h4 text-weight-bold text-white">Kelola <span class="text-amber">Absensi</span></div>
        </div>
        <div class="text-caption text-grey-5 q-ml-lg">Rekap kehadiran siswa per kegiatan</div>
      </div>
      
      <q-btn 
        unelevated
        color="amber" 
        text-color="black" 
        icon="add_circle" 
        label="Absen Manual" 
        class="text-weight-bold shadow-gold"
        padding="10px 20px"
        @click="bukaDialogTambah"
      />
    </div>

    <div class="row q-mb-md">
      <div class="col-12 col-md-4">
        <q-input 
          dark outlined dense 
          v-model="filter" 
          placeholder="Cari Nama Siswa / Kegiatan..." 
          color="amber"
          class="bg-grey-10 rounded-borders"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-5" />
          </template>
        </q-input>
      </div>
    </div>

    <q-table
      :rows="listAbsensi"
      :columns="columns"
      row-key="id"
      :loading="loading"
      dark
      flat
      :filter="filter"
      card-class="bg-grey-10 border-gold-thin text-white"
      table-header-class="text-amber text-uppercase text-weight-bold"
    >
      <template v-slot:body-cell-nama="props">
        <q-td :props="props">
          <div class="row items-center">
            <q-avatar size="sm" color="grey-8" text-color="amber" class="q-mr-sm text-weight-bold font-mono">
              {{ getInitials(props.row.nama) }}
            </q-avatar>
            <div>
              <div class="text-weight-bold">{{ props.row.nama }}</div>
              <div class="text-caption text-grey-5">{{ props.row.kelas || '-' }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-tanggal="props">
        <q-td :props="props">
          <div class="row items-center">
            <q-icon name="event" size="xs" color="grey-6" class="q-mr-xs" />
            {{ formatDate(props.value) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-status="props">
        <q-td :props="props" class="text-center">
          <q-chip 
            :color="getWarnaStatus(props.value)" 
            text-color="white" 
            dense 
            square
            class="text-weight-bold shadow-2 q-px-md"
            icon="circle"
          >
            {{ props.value.toUpperCase() }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-aksi="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round color="light-blue-4" icon="edit" size="sm" @click="bukaDialogEdit(props.row)">
            <q-tooltip class="bg-grey-9">Edit Status</q-tooltip>
          </q-btn>
          <q-btn flat round color="red-4" icon="delete_outline" size="sm" @click="hapusAbsensi(props.row.id)">
            <q-tooltip class="bg-grey-9">Hapus Data</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:no-data>
        <div class="full-width row flex-center q-pa-xl text-grey-6">
          <div class="text-center">
            <q-icon name="folder_off" size="60px" class="q-mb-md" />
            <div>Belum ada data absensi ditemukan.</div>
          </div>
        </div>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card style="min-width: 400px" class="bg-grey-10 text-white border-top-gold shadow-gold">
        
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-amber">{{ isEdit ? 'Edit Status Absen' : 'Input Absen Manual' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-5" />
        </q-card-section>

        <q-card-section class="q-gutter-y-md q-mt-sm">
          
          <q-select
            outlined dark dense
            v-model="form.kegiatan_id"
            :options="listKegiatan"
            option-label="nama_kegiatan"
            option-value="id"
            emit-value map-options
            label="Pilih Kegiatan"
            color="amber"
            :disable="isEdit" 
          >
            <template v-slot:prepend><q-icon name="event" /></template>
          </q-select>

          <q-select
            v-if="!isEdit"
            outlined dark dense
            v-model="form.user_id"
            :options="listAnggota"
            option-label="nama_lengkap"
            option-value="id"
            emit-value map-options
            label="Cari Nama Siswa"
            color="amber"
            use-input
            input-debounce="0"
            @filter="filterAnggota"
          >
            <template v-slot:prepend><q-icon name="person" /></template>
            <template v-slot:no-option>
              <q-item><q-item-section class="text-grey">Tidak ditemukan</q-item-section></q-item>
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.nama_lengkap }}</q-item-label>
                  <q-item-label caption class="text-grey">{{ scope.opt.kelas }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div v-else class="bg-grey-9 q-pa-md rounded-borders border-left-amber">
            <div class="text-caption text-grey-5">Nama Siswa</div>
            <div class="text-subtitle1 text-weight-bold">{{ form.nama_temp }}</div>
          </div>

          <div class="text-caption text-grey-5 q-mb-xs">Status Kehadiran</div>
          <div class="row q-gutter-sm">
             <q-radio v-model="form.status" val="Hadir" label="Hadir" color="green-4" dark dense />
             <q-radio v-model="form.status" val="Izin" label="Izin" color="blue-4" dark dense />
             <q-radio v-model="form.status" val="Sakit" label="Sakit" color="orange-4" dark dense />
             <q-radio v-model="form.status" val="Alpha" label="Alpha" color="red-4" dark dense />
          </div>

        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-9">
          <q-btn flat label="Batal" color="grey-5" v-close-popup />
          <q-btn 
            unelevated
            :label="isEdit ? 'Update Data' : 'Simpan Absen'" 
            color="amber" 
            text-color="black" 
            class="text-weight-bold" 
            @click="simpanData" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar, date } from 'quasar'

const $q = useQuasar()
const loading = ref(true)
const listAbsensi = ref([])
const filter = ref('')

// Data Dropdown
const listKegiatan = ref([])
const listAnggota = ref([])
const listAnggotaFull = ref([]) 

// Dialog & Form
const dialogOpen = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  kegiatan_id: null,
  user_id: null,
  status: 'Hadir',
  nama_temp: '' 
})

// Definisi Kolom Tabel
const columns = [
  { name: 'nama', label: 'Siswa', field: 'nama', align: 'left', sortable: true },
  { name: 'kegiatan', label: 'Kegiatan', field: row => row.kegiatan?.nama_kegiatan || '-', align: 'left', sortable: true },
  { name: 'tanggal', label: 'Tanggal', field: row => row.kegiatan?.tanggal || '-', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'aksi', label: '', field: 'aksi', align: 'right' }
]

// === HELPER FUNCTIONS ===
const getWarnaStatus = (status) => {
  if (status === 'Hadir') return 'green-9'
  if (status === 'Izin') return 'blue-9'
  if (status === 'Sakit') return 'orange-9'
  return 'red-9'
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const formatDate = (val) => {
  return date.formatDate(val, 'DD MMM YYYY')
}

// === LOAD DATA ===
const loadRekap = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('absensi')
    .select(`*, kegiatan:kegiatan_id (id, nama_kegiatan, tanggal)`)
    .order('created_at', { ascending: false })
  
  if (!error) listAbsensi.value = data
  loading.value = false
}

const loadOptions = async () => {
  // Ambil Kegiatan (30 hari terakhir biar tidak kepanjangan)
  const { data: keg } = await supabase.from('kegiatan').select('id, nama_kegiatan').order('tanggal', { ascending: false }).limit(20)
  if (keg) listKegiatan.value = keg

  // Ambil Anggota
  const { data: angg } = await supabase.from('profiles').select('id, nama_lengkap, kelas').order('nama_lengkap', { ascending: true })
  if (angg) {
    listAnggotaFull.value = angg
    listAnggota.value = angg
  }
}

// === SEARCH DROPDOWN ===
const filterAnggota = (val, update) => {
  if (val === '') {
    update(() => { listAnggota.value = listAnggotaFull.value })
    return
  }
  update(() => {
    const needle = val.toLowerCase()
    listAnggota.value = listAnggotaFull.value.filter(v => v.nama_lengkap.toLowerCase().indexOf(needle) > -1)
  })
}

// === LOGIKA EDIT & TAMBAH ===
const bukaDialogTambah = () => {
  isEdit.value = false
  form.value = { kegiatan_id: null, user_id: null, status: 'Hadir' }
  dialogOpen.value = true
}

const bukaDialogEdit = (row) => {
  isEdit.value = true
  form.value = {
    id: row.id,
    kegiatan_id: row.kegiatan_id,
    status: row.status,
    nama_temp: row.nama 
  }
  dialogOpen.value = true
}

const simpanData = async () => {
  if (!form.value.kegiatan_id || !form.value.status) {
    return $q.notify({ type: 'warning', message: 'Data belum lengkap!' })
  }

  try {
    if (isEdit.value) {
      // UPDATE
      const { error } = await supabase
        .from('absensi')
        .update({ status: form.value.status })
        .eq('id', form.value.id)
      
      if (error) throw error
      $q.notify({ type: 'positive', message: 'Status berhasil diperbarui', icon: 'check_circle' })

    } else {
      // INSERT MANUAL
      if (!form.value.user_id) return $q.notify({ type: 'warning', message: 'Pilih siswa terlebih dahulu!' })
      const siswa = listAnggotaFull.value.find(x => x.id === form.value.user_id)

      const { error } = await supabase.from('absensi').insert({
        kegiatan_id: form.value.kegiatan_id,
        user_id: form.value.user_id,
        nama: siswa.nama_lengkap,
        kelas: siswa.kelas || '-',
        status: form.value.status,
        lat: 0, long: 0
      })

      if (error) {
        if (error.code === '23505') throw new Error('Siswa ini sudah diabsenkan di kegiatan tersebut!')
        throw error
      }
      $q.notify({ type: 'positive', message: 'Absensi tercatat!', icon: 'check_circle' })
    }

    dialogOpen.value = false
    loadRekap() 

  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}

// === HAPUS ===
const hapusAbsensi = (id) => {
  $q.dialog({
    title: 'Hapus Data?',
    message: 'Data absensi ini akan dihapus permanen.',
    cancel: true,
    persistent: true,
    dark: true,
    ok: { label: 'Ya, Hapus', color: 'red-10', flat: true }
  }).onOk(async () => {
    const { error } = await supabase.from('absensi').delete().eq('id', id)
    if (!error) {
      $q.notify({ type: 'positive', message: 'Data dihapus' })
      loadRekap()
    }
  })
}

onMounted(() => {
  loadRekap()
  loadOptions()
})
</script>

<style scoped>
/* Border & Shadow Mewah */
.border-gold-thin { border: 1px solid rgba(255, 215, 0, 0.2); }
.border-top-gold { border-top: 3px solid #FFD700; }
.border-left-amber { border-left: 4px solid #FFC107; }
.shadow-gold { box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2); }

/* Font Monospace untuk Inisial */
.font-mono { font-family: monospace; }

/* Animasi Fade */
.animate-fade { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>