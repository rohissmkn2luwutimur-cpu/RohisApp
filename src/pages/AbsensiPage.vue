<template>
  <q-page class="q-pa-md bg-black text-white flex flex-center">
    <div class="column full-width" style="max-width: 450px">
      
      <div class="text-center q-mb-xl">
        <q-icon name="fact_check" color="amber" size="60px" />
        <div class="text-h4 text-weight-bold text-white q-mt-sm">Absensi <span class="text-amber">Rohis</span></div>
        <div class="text-grey-5">Silakan isi kehadiranmu hari ini</div>
      </div>
      
      <q-card class="bg-grey-10 border-gold q-mb-md">
        <q-card-section>
          <div class="text-caption text-amber text-weight-bold q-mb-xs">LANGKAH 1: Pilih Kegiatan</div>
          <q-select
            dark outlined dense
            v-model="kegiatanSelected"
            :options="listKegiatan"
            option-label="nama_kegiatan"
            label="Nama Kegiatan"
            color="amber"
            :disable="loading || listKegiatan.length === 0"
          >
            <template v-slot:prepend><q-icon name="event" color="amber" /></template>
            <template v-slot:no-option>
              <q-item><q-item-section class="text-grey">Tidak ada kegiatan hari ini</q-item-section></q-item>
            </template>
          </q-select>
        </q-card-section>
      </q-card>

      <div v-if="checkingStatus" class="text-center q-py-lg">
        <q-spinner-dots color="amber" size="40px" />
        <div class="text-grey q-mt-sm">Mengecek status...</div>
      </div>

      <div v-else-if="kegiatanSelected">

        <q-slide-transition>
          <div v-if="sudahAbsen">
            <q-card class="bg-green-9 text-white shadow-10 text-center q-pa-lg">
              <q-icon name="check_circle" size="80px" />
              <div class="text-h5 text-weight-bold q-mt-md">Absensi Berhasil!</div>
              <div class="text-subtitle1 opacity-80">Data kehadiranmu sudah tersimpan.</div>
            </q-card>
          </div>
        </q-slide-transition>

        <q-slide-transition>
          <div v-if="!sudahAbsen">
            
            <q-card class="bg-grey-10 border-gold q-mb-lg">
              <q-card-section>
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-caption text-amber text-weight-bold">LANGKAH 2: Metode Absen</div>
                </div>

                <div class="row q-gutter-sm q-mb-md">
                  <q-btn 
                    class="col"
                    :color="!pakaiKode ? 'amber' : 'grey-9'"
                    :text-color="!pakaiKode ? 'black' : 'white'"
                    icon="my_location"
                    label="GPS"
                    @click="pakaiKode = false"
                  />
                  <q-btn 
                    class="col"
                    :color="pakaiKode ? 'amber' : 'grey-9'"
                    :text-color="pakaiKode ? 'black' : 'white'"
                    icon="vpn_key"
                    label="Kode"
                    @click="pakaiKode = true"
                  />
                </div>

                <q-separator dark class="q-mb-md" />

                <div v-if="!pakaiKode" class="text-center q-py-md">
                  <div v-if="gpsLoading" class="text-grey animate-pulse">
                    <q-icon name="satellite_alt" size="md" />
                    <div>Mencari lokasi kamu...</div>
                  </div>
                  <div v-else>
                    <div class="text-h3 text-weight-bold font-mono" :class="jarakMeter <= maxJarak ? 'text-green-4' : 'text-red-4'">
                      {{ jarakMeter }} <span class="text-h6 text-grey">m</span>
                    </div>
                    <div class="text-caption text-grey q-mt-xs">Jarak dari Masjid (Maks. {{ maxJarak }}m)</div>
                    
                    <div v-if="jarakMeter > maxJarak" class="q-mt-md bg-red-9 text-white q-pa-sm rounded-borders text-caption">
                      <q-icon name="warning" /> Kamu terlalu jauh. Mendekatlah ke lokasi atau gunakan Mode Kode.
                    </div>
                  </div>
                </div>

                <div v-else>
                  <div class="text-center q-mb-sm text-grey-4">Masukkan Kode Unik dari Panitia/Ketua</div>
                  <q-input
                    dark outlined
                    v-model="inputKode"
                    placeholder="Contoh: ROHIS123"
                    input-class="text-center text-uppercase text-h5 text-weight-bold letter-spacing"
                    color="amber"
                  />
                  <div class="text-caption text-grey text-center q-mt-sm">*Gunakan ini jika GPS bermasalah</div>
                </div>

              </q-card-section>
            </q-card>

            <q-btn 
              :disable="loading || (!pakaiKode && (gpsLoading || jarakMeter > maxJarak))"
              @click="prosesAbsensi"
              :loading="loading"
              color="amber" 
              text-color="black"
              size="lg" 
              class="full-width text-weight-bold shadow-gold q-py-sm" 
              rounded
            >
              <div class="row items-center">
                <q-icon :name="pakaiKode ? 'send' : 'fingerprint'" class="q-mr-sm" />
                <div>{{ pakaiKode ? 'Kirim Kode' : 'Absen Sekarang' }}</div>
              </div>
            </q-btn>

          </div>
        </q-slide-transition>

      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const checkingStatus = ref(false)
const listKegiatan = ref([])
const kegiatanSelected = ref(null)
const sudahAbsen = ref(false)

// Mode & Form
const pakaiKode = ref(false) 
const inputKode = ref('')

// 📍 SETTING LOKASI (Ganti dengan Koordinat Sekolahmu)
const LOKASI_MASJID = { lat: -5.132800, long: 119.439500 }
const maxJarak = 100 // Meter
const userLat = ref(null)
const userLong = ref(null)
const jarakMeter = ref(0)
const gpsLoading = ref(true)

// 1. WATCHER: CEK STATUS SAAT GANTI KEGIATAN
watch(kegiatanSelected, async (newVal) => {
  if (newVal) {
    await cekStatusAbsensi(newVal.id)
  }
})

// 2. CEK DB APAKAH SUDAH ABSEN
const cekStatusAbsensi = async (kegiatanId) => {
  try {
    checkingStatus.value = true
    sudahAbsen.value = false 
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count, error } = await supabase
      .from('absensi')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('kegiatan_id', kegiatanId)

    // Hapus variabel error jika tidak dipakai untuk menghindari ESLint, atau log console
    if (error) console.error(error)
    
    if (count > 0) {
      sudahAbsen.value = true
    }
  } catch (err) {
    console.error(err)
  } finally {
    checkingStatus.value = false
  }
}

// 3. LOAD KEGIATAN HARI INI
const loadKegiatan = async () => {
  const today = new Date().toISOString().split('T')[0]
  
  // Perhatikan: kita ambil kolom kode_absen juga
  const { data } = await supabase
    .from('kegiatan')
    .select('*')
    .eq('tanggal', today) 
  
  if (data) listKegiatan.value = data
}

// 4. GPS LOGIC
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        gpsLoading.value = false
        userLat.value = position.coords.latitude
        userLong.value = position.coords.longitude
        hitungJarak(position.coords.latitude, position.coords.longitude)
      }, 
      (err) => {
        console.warn("GPS Error:", err)
        gpsLoading.value = false
        // Jika GPS error, otomatis sarankan pakai kode
        if (!pakaiKode.value) {
            $q.notify({ type: 'warning', message: 'GPS Sulit didapat. Silakan gunakan Mode Kode.' })
            pakaiKode.value = true 
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  } else {
    gpsLoading.value = false
    pakaiKode.value = true // Force pakai kode jika browser tidak support
  }
}

const hitungJarak = (lat1, lon1) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = LOKASI_MASJID.lat * Math.PI/180;
  const Δφ = (LOKASI_MASJID.lat-lat1) * Math.PI/180;
  const Δλ = (LOKASI_MASJID.long-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  jarakMeter.value = Math.round(R * c);
}

// 5. PROSES SIMPAN ABSEN
const prosesAbsensi = async () => {
  if (!kegiatanSelected.value) return

  // === VALIDASI MODE KODE ===
  if (pakaiKode.value) {
    if (!inputKode.value) return $q.notify({ type: 'warning', message: 'Masukkan kodenya!' })
    
    // Ambil kode dari database & input user
    const kodeDB = (kegiatanSelected.value.kode_absen || '').trim().toUpperCase()
    const kodeInput = inputKode.value.trim().toUpperCase()

    if (!kodeDB) {
      return $q.notify({ type: 'negative', message: 'Panitia belum membuat kode absen untuk kegiatan ini.' })
    }

    if (kodeInput !== kodeDB) {
      return $q.notify({ type: 'negative', message: 'Kode Salah! Silakan tanya panitia.' })
    }
  }
  // ==========================

  loading.value = true
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Sesi habis, login ulang.")

    const { data: profile } = await supabase
      .from('profiles')
      .select('nama_lengkap, kelas')
      .eq('id', user.id)
      .single()

    // Tentukan koordinat (0 jika pakai kode)
    const latFinal = pakaiKode.value ? 0 : (userLat.value || 0)
    const longFinal = pakaiKode.value ? 0 : (userLong.value || 0)

    const { error } = await supabase.from('absensi').insert({
      user_id: user.id,
      kegiatan_id: kegiatanSelected.value.id,
      nama: profile?.nama_lengkap || 'User',
      kelas: profile?.kelas || '-',
      lat: latFinal,
      long: longFinal,
      status: 'Hadir'
    })

    if (error) {
      if (error.code === '23505') throw new Error('Anda sudah absen!')
      throw error
    }

    sudahAbsen.value = true
    $q.notify({ type: 'positive', message: 'Alhamdulillah, absen berhasil!' })

  } catch (err) {
    if (err.message.includes('sudah absen')) {
      sudahAbsen.value = true
    }
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getLocation()
  loadKegiatan()
})
</script>

<style scoped>
.border-gold { border: 1px solid rgba(255, 193, 7, 0.5); }
.shadow-gold { box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); }
.font-mono { font-family: monospace; }
.letter-spacing { letter-spacing: 4px; }
.animate-pulse { animation: pulse 1.5s infinite; }

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>