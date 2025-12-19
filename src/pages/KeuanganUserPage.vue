<template>
  <q-page class="q-pa-md bg-black text-white q-pb-xl">
    
    <div class="row items-center justify-between q-mb-lg animate-fade">
      <div>
        <div class="row items-center">
          <q-icon name="account_balance_wallet" color="amber" size="md" class="q-mr-sm" />
          <div class="text-h5 text-weight-bold">Dana <span class="text-amber">Umat</span></div>
        </div>
        <div class="text-caption text-grey-5 q-ml-lg">Laporan transparansi kas Rohis</div>
      </div>
      <q-btn flat round icon="refresh" color="grey-5" @click="loadData" :loading="loading" />
    </div>

    <div class="q-mb-lg animate-fade">
      <q-card class="bg-gradient-gold text-black shadow-gold border-radius-lg relative-position overflow-hidden">
        <div class="absolute-full pattern-grid" style="opacity: 0.1"></div>
        <q-icon name="payments" size="180px" class="absolute-right" style="opacity: 0.15; right: -30px; bottom: -40px" />
        
        <q-card-section class="q-pa-lg relative-position">
          <div class="row justify-between items-start">
            <q-icon name="verified" size="sm" class="opacity-80" />
            <div class="text-caption text-weight-bold opacity-60 font-mono">ROHIS CARD</div>
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-weight-bold opacity-70">TOTAL SALDO SAAT INI</div>
            <div class="text-h3 text-weight-bold font-mono q-my-xs">
              <span class="text-h5">Rp</span> {{ formatUang(saldo) }}
            </div>
          </div>

          <div class="row q-mt-md justify-between items-end">
            <div>
              <div class="text-caption opacity-60">Update Terakhir</div>
              <div class="text-caption text-weight-bold">{{ lastUpdate }}</div>
            </div>
            <div class="text-overline text-weight-bold opacity-80">ACTIVE</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="row q-col-gutter-md q-mb-lg animate-fade delay-1">
      <div class="col-6">
        <q-card class="bg-grey-10 border-left-green full-height shadow-2">
          <q-card-section class="q-py-sm">
            <div class="row items-center text-green-4 q-mb-xs">
              <q-icon name="arrow_downward" size="xs" class="q-mr-xs" />
              <div class="text-caption text-weight-bold">Pemasukan</div>
            </div>
            <div class="text-h6 text-white font-mono">+{{ formatUangShort(totalMasuk) }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6">
        <q-card class="bg-grey-10 border-left-red full-height shadow-2">
          <q-card-section class="q-py-sm">
            <div class="row items-center text-red-4 q-mb-xs">
              <q-icon name="arrow_upward" size="xs" class="q-mr-xs" />
              <div class="text-caption text-weight-bold">Pengeluaran</div>
            </div>
            <div class="text-h6 text-white font-mono">-{{ formatUangShort(totalKeluar) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="q-mb-xl animate-fade delay-2">
      <div class="text-caption text-grey q-mb-sm">Perbandingan Arus Kas</div>
      <div class="bg-grey-9 rounded-borders overflow-hidden row" style="height: 12px;">
        <div class="bg-green-5 h-100" :style="{ width: persentaseMasuk + '%' }"></div>
        <div class="bg-red-5 h-100" :style="{ width: persentaseKeluar + '%' }"></div>
      </div>
      <div class="row justify-between text-caption text-grey-5 q-mt-xs">
        <span>Masuk {{ persentaseMasuk }}%</span>
        <span>Keluar {{ persentaseKeluar }}%</span>
      </div>
    </div>

    <div class="animate-fade delay-3">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">Riwayat Transaksi</div>
        
        <q-tabs
          v-model="tabFilter"
          dense
          class="text-grey"
          active-color="amber"
          indicator-color="amber"
          narrow-indicator
        >
          <q-tab name="all" label="Semua" no-caps />
          <q-tab name="masuk" label="Masuk" no-caps />
          <q-tab name="keluar" label="Keluar" no-caps />
        </q-tabs>
      </div>

      <div v-if="loading" class="q-gutter-y-md">
        <q-skeleton type="rect" height="60px" class="bg-grey-9" v-for="n in 3" :key="n" />
      </div>

      <div v-else-if="filteredList.length === 0" class="text-center q-pa-xl bg-grey-10 rounded-borders border-dashed">
        <q-icon name="receipt_long" size="50px" color="grey-7" />
        <div class="text-grey-5 q-mt-sm">Belum ada data transaksi.</div>
      </div>

      <q-list v-else separator class="bg-grey-10 rounded-borders border-gold-thin">
        <q-item v-for="item in filteredList" :key="item.id" class="q-py-md hover-effect">
          
          <q-item-section avatar>
            <div class="avatar-box row flex-center" :class="(item.jenis || '').toLowerCase() === 'masuk' ? 'bg-green-9 text-green-2' : 'bg-red-9 text-red-2'">
              <q-icon :name="(item.jenis || '').toLowerCase() === 'masuk' ? 'arrow_downward' : 'arrow_upward'" size="sm" />
            </div>
          </q-item-section>
          
          <q-item-section>
            <q-item-label class="text-weight-bold text-white">{{ item.keterangan }}</q-item-label>
            <q-item-label caption class="text-grey-5 row items-center">
              <q-icon name="event" size="xs" class="q-mr-xs" /> {{ formatDate(item.created_at) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="text-weight-bold font-mono text-subtitle1" :class="(item.jenis || '').toLowerCase() === 'masuk' ? 'text-green-4' : 'text-red-4'">
              {{ (item.jenis || '').toLowerCase() === 'masuk' ? '+' : '-' }} {{ formatUangShort(parseNominal(item.jumlah)) }}
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="text-center q-mt-lg">
        <div class="text-caption text-grey-6">Menampilkan semua data</div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { date } from 'quasar'

const loading = ref(true)
const listKas = ref([])
const tabFilter = ref('all')
const lastUpdate = ref('-')

// === PARSE NOMINAL ===
// Aman untuk data "jumlah" (misal: "50000", "50.000", atau 50000)
const parseNominal = (nilai) => {
  if (!nilai) return 0
  const angkaBersih = String(nilai).replace(/[^0-9]/g, '') 
  return Number(angkaBersih)
}

// === COMPUTED ===
const filteredList = computed(() => {
  if (tabFilter.value === 'all') return listKas.value
  return listKas.value.filter(k => (k.jenis || '').toLowerCase() === tabFilter.value)
})

const totalMasuk = computed(() => {
  return listKas.value
    .filter(k => (k.jenis || '').toLowerCase() === 'masuk')
    .reduce((total, item) => total + parseNominal(item.jumlah), 0) // Pakai kolom jumlah
})

const totalKeluar = computed(() => {
  return listKas.value
    .filter(k => (k.jenis || '').toLowerCase() === 'keluar')
    .reduce((total, item) => total + parseNominal(item.jumlah), 0) // Pakai kolom jumlah
})

const saldo = computed(() => totalMasuk.value - totalKeluar.value)

const totalVolume = computed(() => totalMasuk.value + totalKeluar.value || 1)
const persentaseMasuk = computed(() => Math.round((totalMasuk.value / totalVolume.value) * 100))
const persentaseKeluar = computed(() => Math.round((totalKeluar.value / totalVolume.value) * 100))

// === FORMATTER ===
const formatUang = (n) => Number(n).toLocaleString('id-ID')

const formatUangShort = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'Jt'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'rb'
  return n
}

const formatDate = (val) => {
  if (!val) return '-'
  return date.formatDate(val, 'DD MMM YYYY')
}

// === LOAD DATA ===
const loadData = async () => {
  loading.value = true
  
  // Menggunakan 'created_at' agar sesuai DB
  const { data, error } = await supabase
    .from('kas_rohis')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (data) {
    listKas.value = data
    lastUpdate.value = date.formatDate(new Date(), 'HH:mm')
  }

  if (error) console.error("Error:", error.message)
  loading.value = false
}

onMounted(() => loadData())
</script>

<style scoped>
.bg-gradient-gold { background: linear-gradient(135deg, #FFD700 0%, #FDB931 50%, #FFC107 100%); }
.shadow-gold { box-shadow: 0 8px 20px rgba(255, 215, 0, 0.25); }
.border-radius-lg { border-radius: 20px; }
.pattern-grid { background-image: radial-gradient(#000 1px, transparent 1px); background-size: 10px 10px; }
.opacity-80 { opacity: 0.8; }
.opacity-60 { opacity: 0.6; }
.font-mono { font-family: monospace; }
.border-left-green { border-left: 4px solid #4caf50; border-radius: 8px; }
.border-left-red { border-left: 4px solid #f44336; border-radius: 8px; }
.border-gold-thin { border: 1px solid rgba(255, 215, 0, 0.15); }
.border-dashed { border: 1px dashed rgba(255, 255, 255, 0.2); }
.avatar-box { width: 40px; height: 40px; border-radius: 12px; }
.animate-fade { animation: fadeInUp 0.6s ease-out backwards; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.hover-effect:active { background: rgba(255, 255, 255, 0.05); }
</style>