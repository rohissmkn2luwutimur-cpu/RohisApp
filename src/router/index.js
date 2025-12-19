import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { supabase } from 'src/boot/supabase'

export default route(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to, from, next) => {
    const { data: { session } } = await supabase.auth.getSession()
    const isLoggedIn = !!session

    // 1. Jika ke halaman yang butuh Auth tapi belum login
    if (to.meta.requiresAuth && !isLoggedIn) {
      return next({ name: 'login' })
    }

    // 2. Jika sudah login, cek role untuk proteksi halaman
    if (isLoggedIn) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = profile?.role

      // Jika mencoba akses /admin tapi role-nya 'user'
      if (to.path.startsWith('/admin') && role !== 'admin') {
        return next('/user')
      }

      // Jika mencoba akses /user tapi role-nya 'admin'
      if (to.path.startsWith('/user') && role !== 'user') {
        return next('/admin')
      }

      // Jika sudah di dashboard yang benar, jangan redirect lagi! (STOP LOOP)
      if (to.path === '/admin' && role === 'admin') return next()
      if (to.path === '/user' && role === 'user') return next()
    }

    next()
  })

  return Router
})