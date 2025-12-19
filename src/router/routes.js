const routes = [
  // 1. GROUP KHUSUS LOGIN/REGISTER
  {
    path: '/',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') }
    ]
  },

  // 2. GROUP APLIKASI UTAMA
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'profil', component: () => import('pages/ProfilPage.vue') },
      { path: 'absensi', component: () => import('pages/AbsensiPage.vue') },
      { path: 'keuangan', component: () => import('pages/KeuanganUserPage.vue') },
      { path: 'jadwal', component: () => import('pages/JadwalPage.vue') },
      { path: 'pengumuman', component: () => import('pages/PengumumanPage.vue') },
      { path: 'diskusi', component: () => import('pages/DiskusiPage.vue') },
      
      // === BAGIAN ADMIN ===
      
      // 1. TAMBAHKAN INI (Supaya /admin otomatis lari ke dashboard)
      { path: 'admin', redirect: '/admin/dashboard' },

      // Route Admin yang sudah ada
      { path: 'admin/dashboard', component: () => import('pages/admin/DashboardPage.vue') },
      { path: 'admin/kegiatan', component: () => import('pages/admin/KegiatanPage.vue') },
      { path: 'admin/kas', component: () => import('pages/AdminKas.vue') },
      { path: 'admin/anggota', component: () => import('pages/admin/AdminAnggotaPage.vue') },
      { path: 'admin/absensi', component: () => import('pages/admin/AdminAbsensiPage.vue') },
      { path: 'admin/inventaris', component: () => import('pages/admin/AdminInventarisPage.vue') },
      { path: 'admin/broadcast', component: () => import('pages/admin/AdminBroadcastPage.vue') },
      { path: 'diskusi', component: () => import('pages/DiskusiPage.vue') },
    ]
  },

  // 3. Error 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes