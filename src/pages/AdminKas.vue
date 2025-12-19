<template>
  <q-page class="q-pa-md bg-black text-white q-pb-xl">
    
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <div class="text-h4 text-weight-bold text-amber">Keuangan <span class="text-white">Rohis</span></div>
        <div class="text-subtitle2 text-grey-5">Pantau arus kas dan infaq kegiatan</div>
      </div>
      <q-btn 
        push 
        color="amber" 
        text-color="black" 
        icon="add" 
        label="Catat Baru" 
        class="text-weight-bold shadow-gold"
        @click="dialog = true"
      />
    </div>

    <div class="row q-col-gutter-md q-mb-xl">
      
      <div class="col-12 col-md-4">
        <q-card class="bg-gradient-gold text-black relative-position overflow-hidden h-100 card-hover">
          <div class="absolute-right q-pa-md" style="opacity: 0.15; transform: scale(1.5) translateX(-20px);">
            <q-icon name="account_balance_wallet" size="100px" />
          </div>
          
          <q-card-section class="q-py-lg">
            <div class="row items-center q-mb-sm">
              <q-icon name="account_balance" size="sm" class="q-mr-sm" />
              <div class="text-caption text-uppercase text-weight-bold letter-spacing">Sisa Saldo</div>
            </div>
            <div class="text-h3 text-weight-bold">Rp {{ formatUang(totalSaldo) }}</div>
            <div class="text-caption q-mt-sm bg-white-20 inline-block q-px-sm rounded-borders">
              <q-icon name="check_circle" size="xs" /> Dana Tersedia
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="bg-grey-10 border-left-green relative-position overflow-hidden h-100 card-hover">
          <div class="absolute-right q-pa-md" style="opacity: 0.1;">
            <q-icon name="trending_up" color="green-4" size="90px" />
          </div>
          <q-card-section class="q-py-lg">
            <div class="text-grey-5 text-caption text-uppercase text-weight-bold q-mb-xs">Total Pemasukan</div>
            <div class="text-h4 text-weight-bold text-green-4">+ {{ formatSingkat(totalMasuk) }}</div>
            <div class="text-caption text-grey-6 q-mt-sm">
              <span class="text-green-4">Infaq & Donasi</span>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="bg-grey-10 border-left-red relative-position overflow-hidden h-100 card-hover">
          <div class="absolute-right q-pa-md" style="opacity: 0.1;">
            <q-icon name="trending_down" color="red-4" size="90px" />
          </div>
          <q-card-section class="q-py-lg">
            <div class="text-grey-5 text-caption text-uppercase text-weight-bold q-mb-xs">Total Pengeluaran</div>
            <div class="text-h4 text-weight-bold text-red-4">- {{ formatSingkat(totalKeluar) }}</div>
            <div class="text-caption text-grey-6 q-mt-sm">
              <span class="text-red-4">Belanja & Operasional</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="bg-grey-10 text-white shadow-2">
      <q-card-section class="row items-center justify-between border-bottom-grey">
        <div class="text-h6 text-weight-bold border-left-gold q-pl-sm">Riwayat Transaksi</div>
        <q-btn flat round icon="refresh" color="amber" @click="fetchKas" />
      </q-card-section>

      <q-markup-table flat dark class="bg-transparent">
        <thead>
          <tr class="text-grey-5 text-uppercase text-caption">
            <th class="text-left">Tanggal</th>
            <th class="text-left">Keterangan</th>
            <th class="text-center">Jenis</th>
            <th class="text-right">Nominal</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="listKas.length === 0">
            <td colspan="5" class="text-center text-grey q-py-xl">
              <q-icon name="receipt_long" size="40px" class="q-mb-sm" /><br>
              Belum ada data transaksi.
            </td>
          </tr>
          <tr v-for="item in listKas" :key="item.id" class="hover-row">
            <td class="text-left">{{ formatDate(item.created_at || item.tanggal) }}</td>
            <td class="text-left text-weight-bold">{{ item.keterangan }}</td>
            <td class="text-center">
              <q-badge :color="item.jenis === 'masuk' ? 'green-9' : 'red-9'" class="q-py-xs q-px-sm">
                {{ item.jenis === 'masuk' ? 'IN' : 'OUT' }}
              </q-badge>
            </td>
            <td class="text-right font-mono text-subtitle1" :class="item.jenis === 'masuk' ? 'text-green-4' : 'text-red-4'">
              {{ item.jenis === 'masuk' ? '+' : '-' }} {{ formatUang(item.jumlah) }}
            </td>
            <td class="text-right">
              <q-btn flat round icon="delete_outline" color="grey-6" size="sm" @click="hapusKas(item.id)">
                 <q-tooltip>Hapus</q-tooltip>
              </q-btn>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>

    <q-dialog v-model="dialog" persistent>
      <q-card class="bg-grey-10 text-white border-top-gold" style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-amber">Catat Transaksi Baru</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <div class="row q-gutter-sm">
             <q-radio v-model="form.jenis" val="masuk" label="Pemasukan" color="green-4" dark />
             <q-radio v-model="form.jenis" val="keluar" label="Pengeluaran" color="red-4" dark />
          </div>
          
          <q-input 
            dark outlined 
            v-model="form.jumlah" 
            type="number" 
            label="Nominal (Rp)" 
            color="amber"
            placeholder="0"
          >
            <template v-slot:prepend><span class="text-amber">Rp</span></template>
          </q-input>

          <q-input 
            dark outlined 
            v-model="form.keterangan" 
            label="Keterangan" 
            color="amber" 
            type="textarea" 
            rows="2"
            placeholder="Cth: Infaq Jumat"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey" v-close-popup />
          <q-btn unelevated label="Simpan Transaksi" color="amber" text-color="black" @click="simpanKas" :loading="loading" />
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
const listKas = ref([])
const dialog = ref(false)
const loading = ref(false)

// Form Input
const form = ref({
  jenis: 'masuk',
  jumlah: '',
  keterangan: ''
})

// === COMPUTED (HITUNG OTOMATIS) ===
const totalMasuk = computed(() => {
  return listKas.value
    .filter(k => k.jenis === 'masuk')
    .reduce((a, b) => a + (Number(b.jumlah) || Number(b.nominal) || 0), 0)
})

const totalKeluar = computed(() => {
  return listKas.value
    .filter(k => k.jenis === 'keluar')
    .reduce((a, b) => a + (Number(b.jumlah) || Number(b.nominal) || 0), 0)
})

const totalSaldo = computed(() => totalMasuk.value - totalKeluar.value)

// === FORMATTER ===
const formatUang = (n) => Number(n).toLocaleString('id-ID')
const formatSingkat = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' Jt'
  if (n >= 1000) return (n / 1000).toFixed(0) + ' Rb'
  return n
}
const formatDate = (val) => date.formatDate(val, 'DD MMM YYYY')

// === LOGIKA DATABASE ===

// 1. Ambil Data
const fetchKas = async () => {
  const { data } = await supabase
    .from('kas_rohis')
    .select('*')
    .order('created_at', { ascending: false }) // Urutkan dari yang terbaru
  
  if (data) listKas.value = data
}

// 2. Simpan Data
const simpanKas = async () => {
  if (!form.value.jumlah || !form.value.keterangan) {
    return $q.notify({ type: 'warning', message: 'Nominal dan Keterangan wajib diisi' })
  }

  loading.value = true
  
  // Perhatikan: Kita pakai kolom 'jumlah' sesuai database perbaikan
  const { error } = await supabase.from('kas_rohis').insert({
    jenis: form.value.jenis,
    jumlah: form.value.jumlah, 
    keterangan: form.value.keterangan,
    created_at: new Date()
  })

  loading.value = false
  
  if (!error) {
    $q.notify({ type: 'positive', message: 'Transaksi tersimpan', icon: 'check_circle' })
    dialog.value = false
    form.value.jumlah = ''
    form.value.keterangan = ''
    fetchKas() // Refresh tabel
  } else {
    $q.notify({ type: 'negative', message: 'Gagal: ' + error.message })
  }
}

// 3. Hapus Data
const hapusKas = async (id) => {
  $q.dialog({
    title: 'Hapus?',
    message: 'Data tidak bisa dikembalikan.',
    cancel: true,
    persistent: true,
    dark: true
  }).onOk(async () => {
    await supabase.from('kas_rohis').delete().eq('id', id)
    fetchKas()
    $q.notify({ message: 'Data dihapus', color: 'grey-8', textColor: 'white', icon: 'delete' })
  })
}

onMounted(() => fetchKas())
</script>

<style scoped>
/* Gradient Emas */
.bg-gradient-gold { 
  background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); 
}

/* Glow Border Effect */
.border-left-green { border-left: 4px solid #4caf50; }
.border-left-red { border-left: 4px solid #f44336; }
.border-top-gold { border-top: 3px solid #FFD700; }
.border-left-gold { border-left: 4px solid #FFD700; }
.border-bottom-grey { border-bottom: 1px solid rgba(255,255,255,0.1); }

/* Shadow */
.shadow-gold { box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); }

/* Helper Text */
.letter-spacing { letter-spacing: 1px; }
.bg-white-20 { background: rgba(255, 255, 255, 0.2); }
.font-mono { font-family: monospace; }
.h-100 { height: 100%; }

/* Hover Animations */
.card-hover { transition: transform 0.3s, box-shadow 0.3s; }
.card-hover:hover { 
  transform: translateY(-5px); 
  box-shadow: 0 5px 15px rgba(0,0,0,0.5); 
}
.hover-row:hover { background: rgba(255, 255, 255, 0.05); }
</style>