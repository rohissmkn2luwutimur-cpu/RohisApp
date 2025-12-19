<template>
  <q-page class="q-pa-md bg-black text-white">
    
    <div class="row items-center q-mb-lg animate-fade">
      <div class="col">
        <div class="text-subtitle1 text-grey-5">Ahlan wa Sahlan,</div>
        <div class="text-h4 text-weight-bold text-amber">{{ namaPanggilan }}</div>
      </div>
      <div class="col-auto">
        <q-avatar size="50px" class="bg-grey-9 text-amber border-gold">
          {{ inisial }}
        </q-avatar>
      </div>
    </div>

    <div v-if="nextEvent" class="q-mb-lg animate-fade delay-100">
      <div class="text-caption text-grey-5 q-mb-xs">JANGAN LEWATKAN</div>
      <q-card class="bg-gradient-gold text-black overflow-hidden relative-position">
        <div class="absolute-right opacity-30 q-mr-n-md">
          <q-icon name="campaign" size="100px" />
        </div>
        
        <q-card-section>
          <q-badge color="black" text-color="amber" class="q-mb-sm">Terdekat</q-badge>
          <div class="text-h5 text-weight-bold leading-tight">{{ nextEvent.nama_kegiatan }}</div>
          <div class="q-mt-md row items-center">
            <q-icon name="event" size="xs" class="q-mr-xs" />
            <span class="text-weight-medium">{{ formatDate(nextEvent.tanggal) }}</span>
          </div>
          <div class="row items-center q-mt-xs">
            <q-icon name="place" size="xs" class="q-mr-xs" />
            <span class="text-caption">{{ nextEvent.lokasi }}</span>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="q-mb-lg animate-fade">
      <q-card class="bg-grey-9 text-grey-5 border-dashed">
        <q-card-section class="text-center q-py-lg">
          <div class="text-subtitle2">Belum ada agenda terdekat.</div>
          <div class="text-caption">Istirahatlah yang cukup! ☕</div>
        </q-card-section>
      </q-card>
    </div>

    <q-card class="bg-grey-10 border-left-gold q-mb-xl animate-fade delay-200">
      <q-card-section>
        <div class="text-italic text-grey-4 text-subtitle1" style="font-family: serif;">
          "{{ dailyQuote.text }}"
        </div>
        <div class="text-right text-amber q-mt-sm text-weight-bold text-caption">
          — {{ dailyQuote.source }}
        </div>
      </q-card-section>
    </q-card>

    <div class="text-h6 text-white q-mb-md">Menu Anggota</div>
    <div class="row q-col-gutter-sm animate-fade delay-300">
      <div class="col-4 col-sm-3" v-for="menu in userMenus" :key="menu.title">
         <q-card 
          class="bg-grey-10 text-center cursor-pointer my-card q-py-md"
          v-ripple
          @click="$router.push(menu.link)"
        >
          <q-icon :name="menu.icon" size="2em" color="amber" />
          <div class="text-caption q-mt-sm text-grey-3">{{ menu.title }}</div>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { date } from 'quasar'

const namaUser = ref('')
const nextEvent = ref(null)

const inisial = computed(() => namaUser.value ? namaUser.value.charAt(0).toUpperCase() : '?')
const namaPanggilan = computed(() => {
  if (!namaUser.value) return 'Anggota'
  return namaUser.value.split(' ')[0] // Ambil kata pertama saja
})

const userMenus = [
  { title: 'Jadwal', icon: 'event_note', link: '/jadwal' },
  { title: 'Absensi', icon: 'qr_code_scanner', link: '/absensi' },
  { title: 'Dana Umat', icon: 'savings', link: '/keuangan' },
  { title: 'Profil', icon: 'person', link: '/profil' },
  { title: 'Diskusi', icon: 'forum', link: '/diskusi' },
  { title: 'Info', icon: 'info', link: '/pengumuman' },
]

const quotes = [
  { text: "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.", source: "HR. Ahmad" },
  { text: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", source: "QS. Al-Baqarah: 286" },
  { text: "Barangsiapa bersabar, maka dia akan beruntung.", source: "Pepatah Arab" }
]
const dailyQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

function formatDate(val) {
  return date.formatDate(val, 'DD MMMM YYYY')
}

// === LOGIKA FETCH USER (REAL DB) ===
async function fetchUserData() {
  // 1. Ambil Nama User
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('nama').eq('id', user.id).single()
    if (profile) namaUser.value = profile.nama || profile.nama_lengkap
  }

  // 2. Ambil 1 Kegiatan Terdekat
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('kegiatan')
    .select('*')
    .gte('tanggal', today)
    .order('tanggal', { ascending: true })
    .limit(1)
    .single()
  
  if (data) nextEvent.value = data
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.border-gold { border: 2px solid #FFD700; }
.border-left-gold { border-left: 4px solid #FFD700; }
.border-dashed { border: 1px dashed rgba(255, 255, 255, 0.2); }
.bg-gradient-gold { background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%); }
.opacity-30 { opacity: 0.3; }

/* Animasi Masuk */
.animate-fade { opacity: 0; animation: fadeIn 0.8s forwards; transform: translateY(10px); }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

@keyframes fadeIn {
  to { opacity: 1; transform: translateY(0); }
}

.my-card { border-radius: 12px; transition: 0.2s; border: 1px solid transparent; }
.my-card:active { transform: scale(0.95); background: #222; border-color: #FFD700; }
</style>