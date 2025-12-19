<template>
  <q-page class="q-pa-md bg-black text-white relative-position">
    
    <div class="row items-center justify-between q-mb-lg animate-fade">
      <div>
        <div class="text-caption text-amber">Halo, Admin</div>
        <div class="text-h4 text-weight-bold">Dashboard <span class="text-amber">Utama</span></div>
      </div>
    </div>

    <div v-if="isLoading" class="row q-col-gutter-md">
      <div class="col-12 col-md-4" v-for="n in 3" :key="n">
        <q-skeleton height="140px" class="bg-grey-9 rounded-borders" />
      </div>
    </div>

    <div v-else class="animate-fade">
      
      <div class="row q-col-gutter-md q-mb-xl">
        
        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="bg-gradient-gold text-black relative-position overflow-hidden h-100 card-hover">
            <q-card-section class="q-py-lg">
              <div class="text-black text-uppercase text-caption text-weight-bold opacity-70">Saldo Kas</div>
              <div class="text-h4 text-weight-bold q-my-sm">{{ formatRupiah(stats.kas) }}</div>
              <div class="text-caption bg-white-20 q-px-sm rounded-borders inline-block">Dana Tersedia</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="bg-grey-10 border-gold-thin h-100 card-hover">
            <q-card-section class="q-py-lg">
              <div class="text-grey-5 text-uppercase text-caption text-weight-bold">Total Anggota</div>
              <div class="text-h3 text-weight-bold text-white q-my-sm">{{ stats.anggota }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <q-card class="bg-grey-10 border-gold-thin h-100 card-hover">
            <q-card-section class="q-py-lg">
              <div class="text-grey-5 text-uppercase text-caption text-weight-bold">Agenda</div>
              <div class="text-h3 text-weight-bold text-white q-my-sm">{{ stats.kegiatan }}</div>
            </q-card-section>
          </q-card>
        </div>

      </div>

      <div class="q-mb-xl">
        <div class="text-h6 text-white q-mb-md border-left-gold q-pl-sm">Mutasi Terakhir</div>
        <q-list separator class="bg-grey-10 rounded-borders border-grey-8">
          <q-item v-for="trx in recentTrx" :key="trx.id" class="q-py-md">
            <q-item-section>
              <div class="text-weight-bold text-white">{{ trx.keterangan || 'Tanpa Ket' }}</div>
              <div class="text-caption text-grey-5">{{ formatDate(trx.created_at) }}</div>
            </q-item-section>
            <q-item-section side>
              <div :class="trx.jenis === 'masuk' ? 'text-green-4' : 'text-red-4'" class="text-weight-bold">
                {{ trx.jenis === 'masuk' ? '+' : '-' }} {{ formatRupiah(trx.jumlah) }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { date } from 'quasar'

const isLoading = ref(true)
const stats = ref({ anggota: 0, kas: 0, kegiatan: 0 })
const recentTrx = ref([])

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}
function formatDate(val) {
  return date.formatDate(val, 'DD MMM, HH:mm')
}

async function fetchAdminData() {
  try {
    isLoading.value = true
    
    // 1. Hitung Anggota
    const { count: countAnggota } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    
    // 2. Hitung Kegiatan
    const { count: countKegiatan } = await supabase.from('kegiatan').select('*', { count: 'exact', head: true }).gte('tanggal', new Date().toISOString())

    // 3. Ambil Kas (HAPUS ', error' DI SINI BIAR TIDAK MERAH)
    const { data: dataKas } = await supabase
      .from('kas_rohis')
      .select('*')
      .order('created_at', { ascending: false })
    
    let totalKas = 0
    if (dataKas) {
      dataKas.forEach(trx => {
        const nominal = Number(trx.jumlah) || 0 
        if (trx.jenis === 'masuk') totalKas += nominal
        else totalKas -= nominal
      })
      recentTrx.value = dataKas.slice(0, 5)
    }

    stats.value = { anggota: countAnggota || 0, kegiatan: countKegiatan || 0, kas: totalKas }

  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => fetchAdminData())
</script>

<style scoped>
.bg-gradient-gold { background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%); }
.border-gold-thin { border: 1px solid rgba(255, 215, 0, 0.2); }
.border-left-gold { border-left: 4px solid #FFD700; }
.opacity-70 { opacity: 0.7; }
.bg-white-20 { background: rgba(255,255,255,0.2); }
</style>