import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createSite } from './server/core.mjs'

// While developing, the admin panel's API and uploaded files are served by the same server as the site.
const admin = () => ({
  name: 'aknova-admin',
  configureServer(server) {
    const site = createSite(server.config.root)
    server.middlewares.use(async (req, res, next) => {
      try {
        if ((await site.api(req, res)) || site.files(req, res)) return
      } catch (e) {
        return next(e)
      }
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), admin()],
  // Saving in the admin panel rewrites files in content/. That must not reload the page being edited.
  server: { port: 5193, strictPort: true, watch: { ignored: ['**/content/**'] } },
})
