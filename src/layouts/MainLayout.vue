<template>
  <q-layout view="lHh Lpr lFf">

    <q-header elevated class="bg-black text-white border-bottom-gold">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" color="amber" />
        
        <q-toolbar-title class="row items-center">
          <q-icon name="mosque" color="amber" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">ROHIS<span class="text-amber">APP</span></span>
        </q-toolbar-title>

        <q-btn flat round dense icon="logout" color="red-4" @click="confirmLogout">
          <q-tooltip>Keluar Aplikasi</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-10 text-white" :width="260">
      
      <div class="column flex-center q-py-lg q-mb-md relative-position">
        <div class="avatar-glow q-mb-sm">
          <q-avatar size="70px" class="bg-grey-9 border-gold text-black font-weight-bold">
            <span class="text-h4 text-amber">{{ namaUser ? namaUser.charAt(0).toUpperCase() : '?' }}</span>
          </q-avatar>
        </div>
        
        <div class="text-subtitle1 text-weight-bold text-amber q-px-md text-center">
          {{ namaUser }}
        </div>
        
        <q-badge :color="roleUser === 'admin' ? 'red-9' : 'green-7'" class="q-mt-xs text-uppercase">
          {{ roleUser }}
        </q-badge>
      </div>

      <q-item-label header class="text-grey-6 text-weight-bold q-pl-md q-mb-sm text-uppercase text-caption">
        Menu {{ roleUser === 'admin' ? 'Administrator' : 'Utama' }}
      </q-item-label>

      <q-list padding>
        <q-item 
          v-for="link in menuList" 
          :key="link.title" 
          clickable 
          v-ripple 
          :to="link.link"
          active-class="menu-active"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" :color="$route.path === link.link ? 'amber' : 'grey-5'"/>
          </q-item-section>
          <q-item-section>{{ link.title }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-black">
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-grey-10 text-white mobile-only border-top-gold">
      
      <q-tabs 
        v-if="roleUser === 'admin'"
        no-caps 
        active-color="amber" 
        indicator-color="transparent" 
        class="text-grey-5"
        align="justify"
      >
        <q-route-tab to="/admin/dashboard" icon="dashboard" label="Admin" />
        <q-route-tab to="/admin/kegiatan" icon="edit_calendar" label="Kegiatan" />
        
        <q-route-tab to="/admin/absensi" class="text-amber">
          <q-icon name="assignment_turned_in" size="32px" />
        </q-route-tab>

        <q-route-tab to="/admin/kas" icon="account_balance_wallet" label="Kas" />
        <q-route-tab to="/profil" icon="person" label="Akun" />
      </q-tabs>

      <q-tabs 
        v-else
        no-caps 
        active-color="amber" 
        indicator-color="transparent" 
        class="text-grey-5"
        align="justify"
      >
        <q-route-tab to="/home" icon="home" label="Home" />
        <q-route-tab to="/jadwal" icon="event" label="Jadwal" />
        
        <q-route-tab to="/absensi" class="text-amber">
          <q-icon name="fingerprint" size="32px" />
        </q-route-tab>

        <q-route-tab to="/diskusi" icon="forum" label="Chat" />
        <q-route-tab to="/profil" icon="person" label="Akun" />
      </q-tabs>

    </q-footer>

  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()
const router = useRouter()
const leftDrawerOpen = ref(false)

// State
const namaUser = ref('Memuat...') 
const roleUser = ref('user') // Default user biar aman
const menuList = ref([])

// DEFINISI MENU SIDEBAR (SAMA SEPERTI SEBELUMNYA)
const menuAdmin = [
  { title: 'Dashboard Admin', icon: 'dashboard', link: '/admin/dashboard' },
  { title: 'Data Anggota', icon: 'groups', link: '/admin/anggota' },
  { title: 'Jadwal Kegiatan', icon: 'event', link: '/admin/kegiatan' },
  { title: 'Rekap Absensi', icon: 'assignment_turned_in', link: '/admin/absensi' },
  { title: 'Kas & Keuangan', icon: 'account_balance_wallet', link: '/admin/kas' },
  { title: 'Inventaris', icon: 'inventory_2', link: '/admin/inventaris' },
  { title: 'Broadcast WA', icon: 'campaign', link: '/admin/broadcast' },
  { title: 'Forum Diskusi', icon: 'forum', link: '/diskusi' },
]

const menuUser = [
  { title: 'Home', icon: 'home', link: '/home' },
  { title: 'Jadwal Saya', icon: 'event_note', link: '/jadwal' },
  { title: 'Absensi', icon: 'qr_code_scanner', link: '/absensi' },
  { title: 'Forum Diskusi', icon: 'forum', link: '/diskusi' },
  { title: 'Pengumuman', icon: 'campaign', link: '/pengumuman' },
  { title: 'Dana Umat', icon: 'savings', link: '/keuangan' },
  { title: 'Profil Saya', icon: 'person', link: '/profil' },
  { title: 'Ruang Diskusi', icon: 'forum', link: '/diskusi' },
]

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function confirmLogout() {
  $q.dialog({
    title: 'Konfirmasi Logout',
    message: 'Yakin ingin keluar?',
    persistent: true,
    dark: true,
    ok: { label: 'Keluar', color: 'amber', textColor: 'black' },
    cancel: { label: 'Batal', color: 'grey-7', flat: true }
  }).onOk(async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  })
}

async function getProfileData() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      namaUser.value = profile.nama || profile.nama_lengkap || profile.full_name || 'Tanpa Nama'
      roleUser.value = profile.role || 'user' // INI KUNCI UTAMANYA

      // Update Sidebar Menu
      if (roleUser.value === 'admin') {
        menuList.value = menuAdmin
      } else {
        menuList.value = menuUser
      }
    }
  } catch (err) {
    console.error("System Error:", err)
  }
}

onMounted(() => {
  getProfileData()
})
</script>

<style scoped>
.mobile-only { display: block; }
@media (min-width: 600px) { .mobile-only { display: none; } }

.border-bottom-gold { border-bottom: 1px solid rgba(255, 193, 7, 0.3); }
.border-top-gold { border-top: 1px solid rgba(255, 193, 7, 0.3); }
.border-gold { border: 2px solid #FFD700; }
.avatar-glow { filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.4)); }

.menu-active {
  color: #FFD700 !important;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, transparent 100%);
  border-right: 4px solid #FFD700;
}
</style>