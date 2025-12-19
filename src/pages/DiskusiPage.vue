<template>
  <q-page class="bg-black relative-position" style="overflow: hidden; height: calc(100vh - 100px);">
    
    <div 
      class="bg-grey-10 border-bottom-gold row items-center q-pa-md absolute-top" 
      style="height: 60px; z-index: 20; width: 100%;"
    >
      <q-icon name="forum" color="amber" size="sm" class="q-mr-sm" />
      <div class="column">
        <div class="text-subtitle1 text-white text-weight-bold" style="line-height: 1.2;">Forum Diskusi</div>
        <div class="text-caption text-green" style="font-size: 10px;">• Online</div>
      </div>
      <q-space />
      <div class="text-caption text-grey">
        {{ messages.length }} Chat
      </div>
    </div>

    <div 
      class="bg-black absolute-top absolute-bottom full-width" 
      style="top: 60px; bottom: 70px; z-index: 10;"
    >
      <q-scroll-area ref="scrollAreaRef" class="fit q-px-sm">
        <div class="q-py-md">
          
          <div v-if="loading" class="row justify-center q-my-md">
            <q-spinner-dots color="amber" size="md" />
          </div>

          <div v-if="!loading && messages.length === 0" class="text-center text-grey-8 q-mt-xl">
            <q-icon name="chat_bubble_outline" size="50px" />
            <div class="q-mt-sm">Belum ada obrolan.</div>
          </div>

          <div v-for="chat in messages" :key="chat.id" class="q-mb-sm message-anim">
            <q-chat-message
              :name="chat.nama_pengirim"
              :text="[chat.isi_pesan]"
              :sent="chat.user_id === myUserId"
              :bg-color="chat.user_id === myUserId ? 'amber-9' : 'grey-9'"
              :text-color="chat.user_id === myUserId ? 'black' : 'white'"
              :stamp="formatJam(chat.created_at)"
            >
              <template v-slot:avatar>
                <q-avatar size="32px" class="q-mx-xs shadow-1">
                  <div 
                    class="full-height full-width flex flex-center text-weight-bold"
                    :class="chat.user_id === myUserId ? 'bg-amber-9 text-black' : 'bg-grey-8 text-amber'"
                    style="font-size: 14px;"
                  >
                    {{ chat.nama_pengirim ? chat.nama_pengirim.charAt(0).toUpperCase() : '?' }}
                  </div>
                </q-avatar>
              </template>
            </q-chat-message>
          </div>

        </div>
      </q-scroll-area>
    </div>

    <div 
      class="bg-grey-10 border-top-gold q-pa-sm absolute-bottom" 
      style="height: 70px; width: 100%; z-index: 20;"
    >
      <q-form @submit.prevent="kirimPesan" class="row items-center full-height">
        <q-input
          dark filled dense rounded
          v-model="pesanBaru"
          placeholder="Ketik pesan..."
          class="col q-mr-sm"
          bg-color="black"
          color="amber"
          autocomplete="off"
        />
        <q-btn 
          round flat 
          icon="send" 
          color="amber" 
          type="submit" 
          :disable="!pesanBaru"
          class="rotate-45"
        />
      </q-form>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from 'src/boot/supabase'
import { date } from 'quasar'

const messages = ref([])
const pesanBaru = ref('')
const myUserId = ref(null)
const myProfile = ref({})
const loading = ref(true)
const scrollAreaRef = ref(null)
let realtimeChannel = null

const formatJam = (waktu) => {
  return date.formatDate(waktu, 'HH:mm')
}

// Scroll Otomatis
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollAreaRef.value) {
      scrollAreaRef.value.setScrollPercentage('vertical', 1.1, 300)
    }
  })
}

// Load Pesan
const loadMessages = async () => {
  const { data } = await supabase
    .from('diskusi')
    .select('*')
    .order('created_at', { ascending: true }) 
    .limit(100)

  if (data) {
    messages.value = data
    loading.value = false
    scrollToBottom()
  }
}

// Kirim Pesan
const kirimPesan = async () => {
  if (!pesanBaru.value.trim()) return

  const text = pesanBaru.value
  pesanBaru.value = '' 

  const { error } = await supabase.from('diskusi').insert({
    user_id: myUserId.value,
    nama_pengirim: myProfile.value.nama_lengkap || 'Hamba Allah',
    role_pengirim: myProfile.value.role || 'user',
    isi_pesan: text
  })

  if (error) console.error('Gagal kirim:', error)
}

// Realtime Setup
const setupRealtime = () => {
  realtimeChannel = supabase
    .channel('public:diskusi')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'diskusi' },
      (payload) => {
        messages.value.push(payload.new)
        scrollToBottom()
      }
    )
    .subscribe()
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    myUserId.value = user.id
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) myProfile.value = profile
  }
  await loadMessages()
  setupRealtime()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* Dekorasi */
.border-bottom-gold { border-bottom: 1px solid rgba(255, 193, 7, 0.2); }
.border-top-gold { border-top: 1px solid rgba(255, 193, 7, 0.2); }

/* Animasi Chat */
.message-anim {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.rotate-45 { transform: rotate(-45deg); margin-bottom: 4px; }
</style>