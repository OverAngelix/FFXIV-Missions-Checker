import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'save-duties-plugin',
      configureServer(server) {
        server.middlewares.use('/api/save-duties', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString() });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data.password !== '123') {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Mot de passe incorrect' }));
                  return;
                }
                const filepath = path.resolve(__dirname, 'src/assets/duties.json');
                fs.writeFileSync(filepath, JSON.stringify(data.duties, null, 2) + '\n');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.toString() }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
