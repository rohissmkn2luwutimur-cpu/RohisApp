<template>
  <q-page class="q-pa-md bg-black text-white">
    
    <div class="row justify-between items-center q-mb-md">
      <div>
        <div class="text-h5 text-amber text-weight-bold">Jadwal Kegiatan</div>
        <div class="text-caption text-grey">Kelola jadwal & notifikasi</div>
      </div>
      <q-btn color="amber" text-color="black" icon="add" label="Buat Baru" @click="openDialog()" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="k in kegiatanList" :key="k.id" class="col-12 col-md-6">
        <q-card class="bg-grey-9 text-white shadow-2">
          <div class="q-pa-md row no-wrap items-center">
            <div class="col">
              <div class="text-h6">{{ k.nama_kegiatan }}</div>
              <div class="text-caption text-amber">
                {{ k.tanggal }} jam {{ k.jam }}
              </div>
              <q-chip v-if="k.notif_id" size="sm" color="blue" icon="alarm">Pengingat Aktif</q-chip>
            </div>
            <q-btn flat round color="red" icon="delete" @click="hapus(k.id)" />
          </div>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialog">
      <q-card class="bg-grey-9 text-white" style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-amber">Kegiatan Baru</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-input dark filled v-model="form.nama_kegiatan" label="Nama Kegiatan" color="amber" />
          <div class="row q-col-gutter-sm">
            <div class="col-7"><q-input dark filled v-model="form.tanggal" type="date" label="Tanggal" stack-label color="amber" /></div>
            <div class="col-5"><q-input dark filled v-model="form.jam" type="time" label="Jam" stack-label color="amber" /></div>
          </div>
          
          <div class="bg-grey-8 q-pa-sm rounded-borders">
            <q-toggle 
              v-model="setReminder" 
              checked-icon="alarm" 
              color="amber" 
              label="Aktifkan Notifikasi Pengingat" 
              unchecked-icon="alarm_off"
            />
            <div v-if="setReminder" class="text-caption text-grey-4 q-mt-xs q-pl-sm">
              HP akan bunyi saat jam kegiatan tiba.
            </div>
          </div>

        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" v-close-popup />
          <q-btn label="Simpan & Set Alarm" color="amber" text-color="black" @click="simpan" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'
import { LocalNotifications } from '@capacitor/local-notifications' // Import Plugin

const $q = useQuasar()
const kegiatanList = ref([])
const dialog = ref(false)
const setReminder = ref(true)

const form = ref({
  nama_kegiatan: '',
  tanggal: '',
  jam: '16:00',
  notif_id: null // Simpan ID notifikasi agar bisa di-track
})

// --- LOGIKA NOTIFIKASI ---
const scheduleNotification = async (kegiatan) => {
  try {
    // 1. Minta Izin dulu (wajib untuk Android 13+)
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return

    // 2. Gabungkan Tanggal & Jam menjadi object Date
    const jadwalString = `${kegiatan.tanggal}T${kegiatan.jam}:00`
    const jadwalDate = new Date(jadwalString)
    
    // Cek apakah jadwal sudah lewat?
    if (jadwalDate < new Date()) {
      $q.notify({ type: 'warning', message: 'Jadwal sudah lewat, notifikasi tidak diset.' })
      return null
    }

    // 3. Buat ID Unik (Random Number)
    const notifId = Math.floor(Math.random() * 1000000)

    // 4. Jadwalkan
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "⏰ Waktunya Kegiatan!",
          body: `Jangan lupa: ${kegiatan.nama_kegiatan} dimulai sekarang.`,
          id: notifId,
          schedule: { at: jadwalDate },
          sound: 'beep.wav', // Default sound
          smallIcon: 'ic_stat_icon_config_sample', // Icon default capacitor
          actionTypeId: "",
          extra: null
        }
      ]
    })

    return notifId
  } catch (error) {
    console.error("Gagal set notifikasi", error)
    return null
  }
}
// -------------------------

const openDialog = () => {
  form.value = { 
    nama_kegiatan: '', 
    tanggal: new Date().toISOString().split('T')[0], 
    jam: '16:00',
    notif_id: null
  }
  setReminder.value = true
  dialog.value = true
}

const loadData = async () => {
  const { data } = await supabase.from('kegiatan').select('*').order('id', { ascending: false })
  if (data) kegiatanList.value = data
}

const simpan = async () => {
  if (!form.value.nama_kegiatan) return

  // 1. Jika user mencentang reminder, jadwalkan notifikasi
  let scheduledId = null
  if (setReminder.value) {
    scheduledId = await scheduleNotification(form.value)
  }

  // 2. Simpan ke Database Supabase
  const payload = {
    nama_kegiatan: form.value.nama_kegiatan,
    tanggal: form.value.tanggal,
    jam: form.value.jam,
    kategori: 'Harian',
    // Kita simpan ID notifikasi di database (Opsional, perlu tambah kolom notif_id di tabel supabase jika mau permanen)
    // Untuk demo ini, kita anggap kolom 'lokasi' atau field custom bisa dipakai, 
    // tapi idealnya buat kolom baru: ALTER TABLE kegiatan ADD COLUMN notif_id BIGINT;
    notif_id: scheduledId 
  }

  const { error } = await supabase.from('kegiatan').insert(payload)

  if (!error) {
    $q.notify({ 
      type: 'positive', 
      message: setReminder.value ? 'Disimpan & Pengingat Aktif!' : 'Data Disimpan' 
    })
    dialog.value = false
    loadData()
  } else {
    $q.notify({ type: 'negative', message: 'Gagal simpan db' })
  }
}

const hapus = async (id) => {
  if (confirm('Hapus kegiatan?')) {
    await supabase.from('kegiatan').delete().eq('id', id)
    loadData()
  }
}

onMounted(() => loadData())
</script>