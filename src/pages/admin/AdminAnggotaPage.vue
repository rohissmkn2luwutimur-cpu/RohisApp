<template>
  <q-page class="q-pa-md bg-black text-white">
    <div class="text-h5 text-amber q-mb-md">Manajemen Anggota</div>

    <q-table
      dark flat
      :rows="rows"
      :columns="columns"
      row-key="id"
      class="bg-grey-9"
      :loading="loading"
      :filter="filter"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Cari Nama..." color="amber" dark>
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </template>

      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <q-badge :color="props.value === 'admin' ? 'amber' : 'blue-grey'" text-color="black">
            {{ props.value.toUpperCase() }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-aksi="props">
        <q-td :props="props" align="right">
          <q-btn dense flat color="blue" icon="edit" size="sm" @click="editUser(props.row)">
            <q-tooltip>Edit Data</q-tooltip>
          </q-btn>

          <q-btn dense flat size="sm" :icon="props.row.role === 'admin' ? 'arrow_downward' : 'arrow_upward'"
            :color="props.row.role === 'admin' ? 'orange' : 'green'" @click="toggleAdmin(props.row)">
             <q-tooltip>Ubah Jabatan</q-tooltip>
          </q-btn>

          <q-btn dense flat icon="delete" color="red" size="sm" @click="hapusUser(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogEdit">
      <q-card class="bg-grey-9 text-white" style="min-width: 300px">
        <q-card-section class="text-h6 text-amber">Edit Anggota</q-card-section>
        <q-card-section class="q-gutter-y-md">
          <q-input dark filled v-model="form.nama_lengkap" label="Nama Lengkap" color="amber" />
          <q-input dark filled v-model="form.kelas" label="Kelas" color="amber" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Batal" v-close-popup />
          <q-btn label="Simpan" color="amber" text-color="black" @click="simpanEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(true)
const rows = ref([])
const filter = ref('')
const dialogEdit = ref(false)
const form = ref({ id: '', nama_lengkap: '', kelas: '' })

const columns = [
  { name: 'nama', label: 'Nama Lengkap', field: 'nama_lengkap', align: 'left', sortable: true },
  { name: 'kelas', label: 'Kelas', field: 'kelas', align: 'left', sortable: true },
  { name: 'role', label: 'Jabatan', field: 'role', align: 'center', sortable: true },
  { name: 'aksi', label: 'Aksi', align: 'right' }
]

const loadData = async () => {
  loading.value = true
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (data) rows.value = data
  loading.value = false
}

// Buka Dialog Edit
const editUser = (user) => {
  form.value = { id: user.id, nama_lengkap: user.nama_lengkap, kelas: user.kelas }
  dialogEdit.value = true
}

// Simpan Perubahan
const simpanEdit = async () => {
  const { error } = await supabase.from('profiles').update({
    nama_lengkap: form.value.nama_lengkap,
    kelas: form.value.kelas
  }).eq('id', form.value.id)

  if (!error) {
    $q.notify({ type: 'positive', message: 'Data update!' })
    dialogEdit.value = false
    loadData()
  } else {
    $q.notify({ type: 'negative', message: 'Gagal update' })
  }
}

const toggleAdmin = async (user) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
  loadData()
}

const hapusUser = async (id) => {
  if (confirm('Hapus anggota ini?')) {
    await supabase.from('profiles').delete().eq('id', id)
    loadData()
  }
}

onMounted(() => loadData())
</script>