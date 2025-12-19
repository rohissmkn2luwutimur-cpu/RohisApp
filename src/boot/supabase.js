import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnkjghovqzfasexpbcxj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJua2pnaG92cXpmYXNleHBiY3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTg5MjcsImV4cCI6MjA4MTM3NDkyN30.R21hzeFKciTdHXCS2GM5pyUatfXoJp-WWaLE28DT0yc'
export const supabase = createClient(supabaseUrl, supabaseKey)

export default ({ app }) => {
  app.config.globalProperties.$supabase = supabase
}